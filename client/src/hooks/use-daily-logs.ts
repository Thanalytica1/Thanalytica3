// Hooks for Daily Log CRUD operations with offline support
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  DailyLog, 
  dailyLogSchema, 
  getTodayLogId, 
  formatDateId,
  calculateStreak,
  calculateWeeklyAverages,
  generateInsights,
  DailyLogSettings,
  dailyLogSettingsSchema
} from '@shared/daily-log-schema';

// Offline queue for pending writes
const offlineQueue: Map<string, DailyLog> = new Map();
let isOnline = navigator.onLine;

// Listen for online/offline events
window.addEventListener('online', () => {
  isOnline = true;
  processPendingWrites();
});

window.addEventListener('offline', () => {
  isOnline = false;
});

async function processPendingWrites() {
  for (const [logId, log] of offlineQueue.entries()) {
    try {
      await saveLogToFirestore(log);
      offlineQueue.delete(logId);
    } catch (error) {
      console.error(`Failed to sync log ${logId}:`, error);
    }
  }
}

async function saveLogToFirestore(log: DailyLog) {
  const docRef = doc(db, 'users', log.userId, 'dailyLogs', log.id);
  await setDoc(docRef, {
    ...log,
    updatedAt: Timestamp.now(),
    syncStatus: 'synced'
  }, { merge: true });
}

// Hook to get today's log with real-time updates
export function useTodayLog() {
  const { firebaseUser } = useAuth();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!firebaseUser) {
      setLog(null);
      setLoading(false);
      return;
    }
    
    const todayId = getTodayLogId();
    const docRef = doc(db, 'users', firebaseUser.uid, 'dailyLogs', todayId);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const data = snapshot.data();
            const validated = dailyLogSchema.parse({
              ...data,
              id: todayId,
              userId: firebaseUser.uid
            });
            setLog(validated);
          } catch (err) {
            console.error('Validation error:', err);
            setError(err as Error);
          }
        } else {
          // Create empty log for today
          setLog({
            id: todayId,
            userId: firebaseUser.uid,
            date: new Date().toISOString(),
            completed: false,
            source: 'manual',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err);
        setLoading(false);
        
        // Try to get from offline queue
        const offlineLog = offlineQueue.get(todayId);
        if (offlineLog) {
          setLog(offlineLog);
        }
      }
    );
    
    return () => unsubscribe();
  }, [firebaseUser]);
  
  return { log, loading, error };
}

// Hook to save daily log with debouncing and offline support
export function useSaveDailyLog() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const save = useCallback(async (log: Partial<DailyLog>, immediate = false) => {
    if (!firebaseUser) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to save your daily log.',
        variant: 'destructive'
      });
      return;
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const saveFunction = async () => {
      setSaving(true);
      
      try {
        const logId = log.id || getTodayLogId();
        const fullLog: DailyLog = {
          id: logId,
          userId: firebaseUser.uid,
          date: log.date || new Date().toISOString(),
          completed: log.completed ?? false,
          source: log.source || 'manual',
          createdAt: log.createdAt || new Date(),
          updatedAt: new Date(),
          syncStatus: isOnline ? 'synced' : 'pending',
          ...log
        };
        
        // Validate the log
        const validated = dailyLogSchema.parse(fullLog);
        
        if (isOnline) {
          await saveLogToFirestore(validated);
          setLastSaved(new Date());
        } else {
          // Save to offline queue
          offlineQueue.set(logId, validated);
          toast({
            title: 'Saved offline',
            description: 'Your changes will sync when you reconnect.',
          });
        }
      } catch (error) {
        console.error('Save error:', error);
        toast({
          title: 'Save failed',
          description: 'Your changes could not be saved. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setSaving(false);
      }
    };
    
    if (immediate) {
      await saveFunction();
    } else {
      // Debounce for 500ms
      saveTimeoutRef.current = setTimeout(saveFunction, 500);
    }
  }, [firebaseUser, toast]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  return { save, saving, lastSaved };
}

// Hook to get daily logs for a date range
export function useDailyLogs(days = 30) {
  const { firebaseUser } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!firebaseUser) {
      setLogs([]);
      setLoading(false);
      return;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, 'users', firebaseUser.uid, 'dailyLogs'),
      where('date', '>=', startDate.toISOString()),
      orderBy('date', 'desc'),
      limit(days)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logsData: DailyLog[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot) => {
          try {
            const validated = dailyLogSchema.parse({
              ...doc.data(),
              id: doc.id,
              userId: firebaseUser.uid
            });
            logsData.push(validated);
          } catch (err) {
            console.error('Validation error for log:', doc.id, err);
          }
        });
        setLogs(logsData);
        setLoading(false);
      },
      (err) => {
        console.error('Query error:', err);
        setError(err);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [firebaseUser, days]);
  
  return { logs, loading, error };
}

// Hook to get yesterday's log for copying
export function useYesterdayLog() {
  const { firebaseUser } = useAuth();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!firebaseUser) {
      setLog(null);
      setLoading(false);
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayId = formatDateId(yesterday);
    
    const fetchYesterday = async () => {
      try {
        const docRef = doc(db, 'users', firebaseUser.uid, 'dailyLogs', yesterdayId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const validated = dailyLogSchema.parse({
            ...docSnap.data(),
            id: yesterdayId,
            userId: firebaseUser.uid
          });
          setLog(validated);
        }
      } catch (error) {
        console.error('Error fetching yesterday log:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchYesterday();
  }, [firebaseUser]);
  
  return { log, loading };
}

// Hook for calculated metrics
export function useDailyLogMetrics() {
  const { logs, loading } = useDailyLogs(30);
  const [metrics, setMetrics] = useState({
    streak: 0,
    weeklyAverages: {
      thisWeek: { sleep: null, exercise: null, mood: null, stress: null },
      lastWeek: { sleep: null, exercise: null, mood: null, stress: null }
    },
    insights: [] as string[],
    habitStreaks: {} as Record<string, number>
  });
  
  useEffect(() => {
    if (loading || !logs.length) return;
    
    const streak = calculateStreak(logs);
    const weeklyAverages = calculateWeeklyAverages(logs);
    const insights = generateInsights(logs);
    
    // Calculate habit streaks
    const habitKeys = new Set<string>();
    logs.forEach(log => {
      if (log.habits) {
        Object.keys(log.habits).forEach(key => habitKeys.add(key));
      }
    });
    
    const habitStreaks: Record<string, number> = {};
    habitKeys.forEach(key => {
      habitStreaks[key] = logs.filter(l => l.habits?.[key]).length;
    });
    
    setMetrics({
      streak,
      weeklyAverages: weeklyAverages as any,
      insights,
      habitStreaks
    });
  }, [logs, loading]);
  
  return { ...metrics, loading };
}

// Hook for user settings
export function useDailyLogSettings() {
  const { firebaseUser } = useAuth();
  const [settings, setSettings] = useState<DailyLogSettings>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!firebaseUser) {
      setSettings({});
      setLoading(false);
      return;
    }
    
    const docRef = doc(db, 'users', firebaseUser.uid, 'settings', 'dailyLog');
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const validated = dailyLogSettingsSchema.parse(snapshot.data());
            setSettings(validated);
          } catch (err) {
            console.error('Settings validation error:', err);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Settings error:', err);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [firebaseUser]);
  
  const updateSettings = useCallback(async (updates: Partial<DailyLogSettings>) => {
    if (!firebaseUser) return;
    
    try {
      const docRef = doc(db, 'users', firebaseUser.uid, 'settings', 'dailyLog');
      await setDoc(docRef, updates, { merge: true });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, [firebaseUser]);
  
  return { settings, loading, updateSettings };
}