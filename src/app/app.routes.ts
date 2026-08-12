import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { BuilderComponent } from './pages/builder/builder.component';
import { ResponsesComponent } from './pages/responses/responses.component';
import { ViewerComponent } from './pages/viewer/viewer.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuardGuard } from './guards/auth-guard.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

export const routes: Routes = [
  // { path: '', component: HomeComponent },
  { path: '', component: LoginComponent },
  { path: 'dashboard', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuardGuard] 
  },
  { path: 'builder', 
    loadComponent: () => import('./pages/builder/builder.component').then(m => m.BuilderComponent),
    canActivate: [authGuardGuard] , canDeactivate: [unsavedChangesGuard] 
  },
  { path: 'builder/:id', 
    loadComponent: () => import('./pages/builder/builder.component').then(m => m.BuilderComponent),
    canActivate: [authGuardGuard],canDeactivate: [unsavedChangesGuard] 
  },
  { path: 'responses/:id', 
    loadComponent: () => import('./pages/responses/responses.component').then(m => m.ResponsesComponent),
    canActivate: [authGuardGuard] 
  },
  { path: 'f/:id', loadComponent: () => import('./pages/viewer/viewer.component').then(m => m.ViewerComponent) },
  { path: '**', redirectTo: '' }
];
