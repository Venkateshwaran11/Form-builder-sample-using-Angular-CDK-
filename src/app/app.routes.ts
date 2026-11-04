import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuardGuard } from './guards/auth-guard.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';
import { guestGuard } from './guards/guestGaurd';

export const routes: Routes = [
  { path: '', component: LoginComponent, canActivate: [guestGuard] },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuardGuard] 
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuardGuard]
  },
  { 
    path: 'builder', 
    loadComponent: () => import('./pages/builder/builder.component').then(m => m.BuilderComponent),
    canActivate: [authGuardGuard],
    canDeactivate: [unsavedChangesGuard] 
  },
  { 
    path: 'builder/:id', 
    loadComponent: () => import('./pages/builder/builder.component').then(m => m.BuilderComponent),
    canActivate: [authGuardGuard],
    canDeactivate: [unsavedChangesGuard] 
  },
  { 
    path: 'responses/:id', 
    loadComponent: () => import('./pages/responses/responses.component').then(m => m.ResponsesComponent),
    canActivate: [authGuardGuard] 
  },
  {
    path: 'Sign-up',
    loadComponent: () => import('./auth/signup/signup.component').then(m => m.SignupComponent),
    canActivate: [guestGuard]
  },
  { path: 'f/:id', loadComponent: () => import('./pages/viewer/viewer.component').then(m => m.ViewerComponent) },
  { 
    path: 'api-docs', 
    loadComponent: () => import('./shared/components/swagger/swagger.component').then(m => m.SwaggerComponent) 
  },
  { path: '**', redirectTo: '' }
];
