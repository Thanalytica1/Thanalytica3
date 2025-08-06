import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, subDays } from "date-fns";

interface MoodStressEntry {
  date: string;
  mood: number;
  stress: number;
  timestamp: number;
}

export function MoodStressCheckin() {
  const [mood, setMood] = useState<number[]>([5]);
  const [stress, setStress] = useState<number[]>([5]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<MoodStressEntry[]>([]);

  // Load entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('moodStressEntries');
    if (savedEntries) {
      try {
        const parsedEntries = JSON.parse(savedEntries);
        setEntries(parsedEntries);
      } catch (error) {
        console.error('Failed to parse mood stress entries:', error);
        setEntries([]);
      }
    }
  }, []);

  // Get entries for the past 7 days
  const getRecentEntries = () => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);
    
    return entries
      .filter(entry => {
        const entryDate = parseISO(entry.date);
        return entryDate >= sevenDaysAgo && entryDate <= today;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleSaveEntry = () => {
    // Basic validation
    if (mood[0] === undefined || stress[0] === undefined) {
      toast({
        title: "Validation Error",
        description: "Please set both mood and stress levels before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Validation Error",
        description: "Please select a date for your entry.",
        variant: "destructive",
      });
      return;
    }

    const newEntry: MoodStressEntry = {
      date: selectedDate,
      mood: mood[0],
      stress: stress[0],
      timestamp: Date.now(),
    };

    // Remove any existing entry for the same date and add the new one
    const updatedEntries = entries.filter(entry => entry.date !== selectedDate);
    updatedEntries.push(newEntry);

    // Save to localStorage
    try {
      localStorage.setItem('moodStressEntries', JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      
      toast({
        title: "Entry Saved",
        description: `Mood and stress levels recorded for ${format(parseISO(selectedDate), 'MMM d, yyyy')}.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to save entry:', error);
      toast({
        title: "Save Error",
        description: "Failed to save your entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMoodLabel = (value: number) => {
    if (value <= 2) return "Very Low";
    if (value <= 4) return "Low";
    if (value <= 6) return "Moderate";
    if (value <= 8) return "Good";
    return "Excellent";
  };

  const getStressLabel = (value: number) => {
    if (value <= 2) return "Very Low";
    if (value <= 4) return "Low";
    if (value <= 6) return "Moderate";
    if (value <= 8) return "High";
    return "Very High";
  };

  const recentEntries = getRecentEntries();

  return (
    <div className="space-y-6">
      {/* Check-in Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-medical-green">Daily Mood & Stress Check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="checkin-date">Date</Label>
              <Input
                id="checkin-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full"
              />
            </div>

            {/* Mood Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Mood</Label>
                <span className="text-sm text-professional-slate">
                  {mood[0]} - {getMoodLabel(mood[0])}
                </span>
              </div>
              <Slider
                value={mood}
                onValueChange={setMood}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-professional-slate">
                <span>1 - Very Low</span>
                <span>10 - Excellent</span>
              </div>
            </div>

            {/* Stress Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Stress Level</Label>
                <span className="text-sm text-professional-slate">
                  {stress[0]} - {getStressLabel(stress[0])}
                </span>
              </div>
              <Slider
                value={stress}
                onValueChange={setStress}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-professional-slate">
                <span>1 - Very Low</span>
                <span>10 - Very High</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSaveEntry}
            className="w-full md:w-auto bg-medical-green text-white hover:bg-medical-green/90"
          >
            Save Entry
          </Button>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-professional-slate">Past 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <p className="text-professional-slate text-center py-4">
              No entries recorded yet. Start tracking your daily mood and stress levels!
            </p>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.date}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="font-medium text-professional-slate">
                    {format(parseISO(entry.date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-professional-slate">Mood:</span>
                      <span className="font-medium text-medical-green">
                        {entry.mood} - {getMoodLabel(entry.mood)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-professional-slate">Stress:</span>
                      <span className="font-medium text-vitality-gold">
                        {entry.stress} - {getStressLabel(entry.stress)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}