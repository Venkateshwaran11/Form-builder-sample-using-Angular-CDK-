import { Injectable, signal, inject } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private router = inject(Router);
    currentUser = signal<any>(null);

    constructor() {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                this.currentUser.set(JSON.parse(user));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
    }

    setUser(user: any):void {
        this.currentUser.set(user);
    }
    getUserid():string{
       return this.currentUser()?._id??null;
    }

    logout() {
        this.currentUser.set(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/']);
    }
}