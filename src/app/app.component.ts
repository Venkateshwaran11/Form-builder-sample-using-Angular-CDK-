import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { LoginComponent } from './auth/login/login.component';
import { NavbarComponent } from "./shared/views/navbar/navbar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, LoginComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private router = inject(Router);
  public isViewerMode = false;
  public showNavbar = true;
  loginSuccess = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || '';
      this.isViewerMode = url.startsWith('/f/');
      this.showNavbar = !this.isViewerMode && url !== '/' && url !== '';
    });
  }
}