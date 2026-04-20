import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { BuilderComponent } from './pages/builder/builder.component';
import { ResponsesComponent } from './pages/responses/responses.component';
import { ViewerComponent } from './pages/viewer/viewer.component';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  // { path: '', component: HomeComponent },
  // { path: '', component: LoginComponent },
  { path: '', component: HomeComponent },
  { path: 'builder', component: BuilderComponent },
  { path: 'builder/:id', component: BuilderComponent },
  { path: 'responses/:id', component: ResponsesComponent },
  { path: 'f/:id', component: ViewerComponent },
  { path: '**', redirectTo: '' }
];
