import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormVersionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getVersions(formId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/forms/${formId}/versions`);
  }

  publishVersion(formId: string, changelog: string, publishedBy: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms/${formId}/publish`, { changelog, publishedBy });
  }

  compareVersions(formId: string, vA: string | number, vB: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/forms/${formId}/versions/compare?vA=${vA}&vB=${vB}`);
  }

  restoreVersion(formId: string, version: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms/${formId}/versions/${version}/restore`, {});
  }
}