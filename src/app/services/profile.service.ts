import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/analytics/services/auth.service';

export interface CustomField {
  id?: string;
  key: string;
  label: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'url' | 'email';
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role?: string;
  profileImage?: string;
  bio?: string;
  phone?: string;
  designation?: string;
  department?: string;
  organization?: string;
  location?: string;
  customFields?: CustomField[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  getProfile(): Observable<{ success: boolean; user: UserProfile }> {
    return this.http.get<{ success: boolean; user: UserProfile }>(`${this.apiUrl}/auth/profile`).pipe(
      tap(res => {
        if (res && res.user) {
          this.authService.setUser(res.user);
        }
      })
    );
  }

  updateProfile(data: Partial<UserProfile> & { currentPassword?: string; newPassword?: string }): Observable<{ success: boolean; message: string; user: UserProfile }> {
    return this.http.put<{ success: boolean; message: string; user: UserProfile }>(`${this.apiUrl}/auth/profile`, data).pipe(
      tap(res => {
        if (res && res.user) {
          this.authService.setUser(res.user);
        }
      })
    );
  }

  uploadAvatar(file: File): Observable<{ fileUrl: string }> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.http.post<{ fileUrl: string }>(`${this.apiUrl}/upload`, {
          filename: file.name,
          base64: base64
        }).subscribe({
          next: res => {
            observer.next(res);
            observer.complete();
          },
          error: err => observer.error(err)
        });
      };
      reader.onerror = error => observer.error(error);
      reader.readAsDataURL(file);
    });
  }
}

