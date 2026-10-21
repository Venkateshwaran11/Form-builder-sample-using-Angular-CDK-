import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class FormService {
  
  private http = inject(HttpClient)
  private baseUrl = environment.apiUrl;
  constructor() { }

  assignUser(payload:any){
    return this.http.post(`${this.baseUrl}/forms/assign-user`,payload)
  }


}