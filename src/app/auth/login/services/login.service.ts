import { HttpClient } from "@angular/common/http";
import { Injectable, model } from "@angular/core";
import { tap } from "rxjs";
import { environment } from "../../../../environments/environment";

@Injectable({providedIn:'root'})
export class LoginService {

    private apiUrl=environment.apiUrl;
    constructor(private http:HttpClient){}
    
    loginUser(user: any) {
        return this.http.post(`${this.apiUrl}/auth/login`, user).pipe(tap((res: any) => {
            if (res && res.token) {
                localStorage.setItem('token', res.token);
            }
        }));
    }


    registerUser(user: any) {
        return this.http.post(`${this.apiUrl}/auth/register`, user);
    }

    logoutUser() {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
    }



    getUserId() {
        return localStorage.getItem('userId');
    }

}