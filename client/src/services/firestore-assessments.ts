import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HealthAssessment, AssessmentResponse } from '@shared/health-schema';

const COLLECTIONS = {
  ASSESSMENTS: 'healthAssessments',
  RESPONSES: 'assessmentResponses'
} as const;

export class FirestoreAssessmentsService {
  static async getHealthAssessments(
    userId: string, 
    limit = 10, 
    status?: string
  ): Promise<HealthAssessment[]> {
    try {
      const assessmentsRef = collection(db, `users/${userId}/${COLLECTIONS.ASSESSMENTS}`);
      
      let q = query(
        assessmentsRef,
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
      
      if (status) {
        q = query(
          assessmentsRef,
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          firestoreLimit(limit)
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      })) as HealthAssessment[];
    } catch (error) {
      console.error('Error fetching health assessments:', error);
      throw new Error('Failed to fetch health assessments');
    }
  }

  static async getLatestAssessment(userId: string): Promise<HealthAssessment | null> {
    try {
      const assessments = await this.getHealthAssessments(userId, 1, 'completed');
      return assessments.length > 0 ? assessments[0] : null;
    } catch (error) {
      console.error('Error fetching latest assessment:', error);
      throw new Error('Failed to fetch latest assessment');
    }
  }

  static async createAssessment(
    userId: string, 
    data: Partial<HealthAssessment>
  ): Promise<HealthAssessment> {
    try {
      const assessmentsRef = collection(db, `users/${userId}/${COLLECTIONS.ASSESSMENTS}`);
      
      const assessmentData = {
        ...data,
        userId,
        status: data.status || 'in_progress',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(assessmentsRef, assessmentData);
      
      return {
        id: docRef.id,
        ...assessmentData,
        createdAt: assessmentData.createdAt.toDate(),
        updatedAt: assessmentData.updatedAt.toDate()
      } as HealthAssessment;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw new Error('Failed to create assessment');
    }
  }

  static async updateAssessment(
    userId: string,
    assessmentId: string,
    data: Partial<HealthAssessment>
  ): Promise<HealthAssessment> {
    try {
      const assessmentRef = doc(db, `users/${userId}/${COLLECTIONS.ASSESSMENTS}`, assessmentId);
      
      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(assessmentRef, updateData);
      
      const updatedDoc = await getDoc(assessmentRef);
      if (!updatedDoc.exists()) {
        throw new Error('Assessment not found after update');
      }
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: updatedDoc.data().createdAt?.toDate?.() || updatedDoc.data().createdAt,
        updatedAt: updatedDoc.data().updatedAt?.toDate?.() || updatedDoc.data().updatedAt
      } as HealthAssessment;
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw new Error('Failed to update assessment');
    }
  }

  static async submitResponse(
    userId: string,
    assessmentId: string,
    response: Partial<AssessmentResponse>
  ): Promise<AssessmentResponse> {
    try {
      const responsesRef = collection(db, `users/${userId}/${COLLECTIONS.RESPONSES}`);
      
      const responseData = {
        ...response,
        userId,
        assessmentId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(responsesRef, responseData);
      
      return {
        id: docRef.id,
        ...responseData,
        createdAt: responseData.createdAt.toDate(),
        updatedAt: responseData.updatedAt.toDate()
      } as AssessmentResponse;
    } catch (error) {
      console.error('Error submitting response:', error);
      throw new Error('Failed to submit response');
    }
  }

  static async getAssessmentResponses(
    userId: string,
    assessmentId: string
  ): Promise<AssessmentResponse[]> {
    try {
      const responsesRef = collection(db, `users/${userId}/${COLLECTIONS.RESPONSES}`);
      
      const q = query(
        responsesRef,
        where('assessmentId', '==', assessmentId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      })) as AssessmentResponse[];
    } catch (error) {
      console.error('Error fetching assessment responses:', error);
      throw new Error('Failed to fetch responses');
    }
  }

  static async getAssessmentInsights(
    userId: string,
    assessmentId: string
  ): Promise<any> {
    try {
      // For now, we'll generate basic insights from the assessment data
      const assessmentRef = doc(db, `users/${userId}/${COLLECTIONS.ASSESSMENTS}`, assessmentId);
      const assessmentDoc = await getDoc(assessmentRef);
      
      if (!assessmentDoc.exists()) {
        throw new Error('Assessment not found');
      }
      
      const assessment = assessmentDoc.data() as HealthAssessment;
      
      // Basic insights calculation
      return {
        id: assessmentId,
        overallScore: assessment.results?.overallScore || 0,
        recommendations: assessment.results?.recommendations || [],
        keyFindings: assessment.results?.keyFindings || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error fetching assessment insights:', error);
      throw new Error('Failed to fetch insights');
    }
  }

  static async compareAssessments(
    userId: string,
    assessmentIds: string[]
  ): Promise<any> {
    try {
      const assessments = await Promise.all(
        assessmentIds.map(async (id) => {
          const assessmentRef = doc(db, `users/${userId}/${COLLECTIONS.ASSESSMENTS}`, id);
          const assessmentDoc = await getDoc(assessmentRef);
          
          if (assessmentDoc.exists()) {
            return {
              id: assessmentDoc.id,
              ...assessmentDoc.data(),
              createdAt: assessmentDoc.data().createdAt?.toDate?.() || assessmentDoc.data().createdAt
            };
          }
          return null;
        })
      );
      
      const validAssessments = assessments.filter(Boolean);
      
      // Basic comparison logic
      return {
        assessments: validAssessments,
        trends: validAssessments.map(assessment => ({
          assessmentId: assessment?.id,
          score: assessment?.results?.overallScore || 0,
          date: assessment?.createdAt
        })),
        summary: {
          improvement: validAssessments.length > 1 ? 
            (validAssessments[0]?.results?.overallScore || 0) - (validAssessments[validAssessments.length - 1]?.results?.overallScore || 0) : 0
        }
      };
    } catch (error) {
      console.error('Error comparing assessments:', error);
      throw new Error('Failed to compare assessments');
    }
  }
}