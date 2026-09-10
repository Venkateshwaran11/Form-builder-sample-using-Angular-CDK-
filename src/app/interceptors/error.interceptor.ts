import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { SnackbarService } from '../shared/services/snackbar.service';
import { AuthService } from '../core/analytics/services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const snackbar = inject(SnackbarService);
            const auth = inject(AuthService);

    return next(req).pipe(
        catchError((error:HttpErrorResponse)=>{
            switch (error.status) {
          case 401:
            snackbar.error('Unauthorized: Please login again.');
            // e.g., inject(Router).navigate(['/login']);
            break;
          case 403:
            snackbar.error('User Session Expired. Kindly re-login to continue');
            auth.logout()
            break;
          case 404:
            snackbar.error('Resource not found.');
            break;
          case 500:
            snackbar.error('Server Error: Backend is down.');
            break;
          default:
            snackbar.error(error.error?.message || 'An error occurred. Please try again.');
            break;
        }
        return throwError(() => error);
        })
    );
};
