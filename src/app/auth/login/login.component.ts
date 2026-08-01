import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from './services/login.service';
import { AuthService } from '../../core/analytics/services/auth.service';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  @Output() onLogin = new EventEmitter<void>();
  userObject = {
    email: '',
    password: ''
  };
  showPassword = false;

  constructor(private router: Router, private loginService: LoginService, private authService: AuthService, private dialog: MatDialog) { }
  login() {
    this.loginService.loginUser(this.userObject)
      .subscribe({

        next: (res) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.authService.setUser(res.user);
          this.router.navigate(['/dashboard']);
        },

        error: err => {

          this.dialog.open(AlertDialogComponent, {
            data: { title: "Error", message: err.error.message, type: 'error' },
            width: '420px',
            disableClose: false,
            panelClass: 'mat-dialog-clean'
          });

        }

      });

  }
}
