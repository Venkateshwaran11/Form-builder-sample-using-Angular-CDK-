import { CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { authGuardGuard } from "./auth-guard.guard";
import { AuthService } from "../core/analytics/services/auth.service";

export const guestGuard:CanActivateFn = ()=>{

    const router = inject(Router);
    const auth = inject(AuthService)
    const isUserLoggedIn = auth.currentUser()!==null && auth.getAuthToken()!==null;

    if(isUserLoggedIn){
        router.navigate(['/dashboard']);
        return false;
    }
    return true;
}