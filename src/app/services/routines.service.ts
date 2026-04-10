import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ClassEnrollment {
  token: string;
  student_username: string;
  enrollment_time: string;
}

export interface Routine {
  id: number;
  class_id: number;
  task_title: string;
  task_description: string;
  due_date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface RoutineHistory {
  id: number;
  class_id: number;
  user_id: number;
  class_name?: string;
  routine: string;
  routine_intensity: string;
  time_of_submission: string;
  date_of_submission: string;
  img: string;
  student_reflection?: string;
  coach_response?: string;
}

export interface ClassInfo {
  id: number;
  title: string;
  coach_username: string;
  sport: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoutinesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

           // Validate and redeem token
         validateToken(token: string, studentUsername: string, userId?: number | null): Observable<any> {
           return this.http.post<any>(`${this.apiUrl}/validate-token`, {
             token: token,
             student_username: studentUsername,
             user_id: userId
           });
         }

           // Get all enrolled classes (router-based)
         getAllEnrolledClasses(): Observable<any> {
           return this.http.get<any>(`${this.apiUrl}/routes.php?request=getAllEnrolledClasses`);
         }

           // Get enrolled classes by user ID (router-based)
         getEnrolledClassesById(userId: number): Observable<any> {
           return this.http.get<any>(`${this.apiUrl}/routes.php?request=enrolled-classes/id/${userId}`);
         }

         getUserClassRoutinesById(userId: number): Observable<any> {
           return this.http.get<any>(`${this.apiUrl}/routes.php?request=user-class-routines/id/${userId}`);
         }
       
         // Get routines for a specific class (router-based)
         getClassRoutines(classId: number): Observable<any> {
           return this.http.get<any>(`${this.apiUrl}/routes.php?request=class-routines/${classId}`);
          }

         getClassInfo(classId: number): Observable<any> {
           return this.http.get<any>(`${this.apiUrl}/routes.php?request=class-info/${classId}`);
         }

         // Get coach username by ID
         getCoachUsername(coachId: number): Observable<any> {
           return this.http.get<any>(`${this.apiUrl}/routes.php?request=getCoachUsername/${coachId}`);
         }
       
         // Get routine history for a student (router-based)
         getRoutineHistory(studentUsername: string): Observable<any> {
           return this.http.get<any>(`${this.apiUrl}/routes.php?request=routine-history/${studentUsername}`);
         }

        getHoaUserProfById(userId: number): Observable<any> {
          return this.http.get<any>(`${this.apiUrl}/routes.php?request=getHoaUserProf/${userId}`);
        }

           // Submit routine completion
         submitRoutineCompletion(
           routineId: number,
           userId?: number | null,
           imageFile?: File,
           routine?: string,
           intensity?: string,
           reflection?: string,
           dateOfSubmission?: string
         ): Observable<any> {
           const formData = new FormData();
           formData.append('routine_id', routineId.toString());
           if (imageFile) {
             formData.append('image', imageFile);
           }
           if (userId != null) {
             formData.append('user_id', String(userId));
           }
           if (routine) {
             formData.append('routine', routine);
           }
           if (intensity) {
             formData.append('intensity', intensity);
           }
           if (reflection) {
             formData.append('student_reflection', reflection);
           }
           if (dateOfSubmission) {
             formData.append('date_of_submission', dateOfSubmission);
           }
       
           return this.http.post<any>(`${this.apiUrl}/routes.php?request=submit-completion`, formData);
         }

           // Check if routine is completed for today
         checkTodayRoutine(routineId: number, studentUsername: string): Observable<any> {
           return this.http.get<any>(`${this.apiUrl}/routes.php?request=check-today/${routineId}/${studentUsername}`);
         }

  // New: Check today's completion using class_id and user_id directly
  checkTodayRoutineById(classId: number, userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/routes.php?request=check-today-by-id/${classId}/${userId}`);
         }

  getRoutineHistoryForStudentInClass(classId: number, userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/routes.php?request=getRoutineHistoryForStudentInClass&class_id=${classId}&user_id=${userId}`);
  }

}
