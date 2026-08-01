import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from './services/login.service';
import { AuthService } from '../../core/analytics/services/auth.service';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { exhaustMap, Subject, takeUntil, tap, finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  @Output() onLogin = new EventEmitter<void>();
  userObject = {
    email: '',
    password: ''
  };
  showPassword = false;
  isLoading = false;
  loginClick$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  constructor(private router: Router, private loginService: LoginService, private authService: AuthService, private dialog: MatDialog) { }
  
  ngOnInit(): void {
    this.loginClick$
    .pipe(
      tap(() => this.isLoading = true),
      exhaustMap(() => this.loginService.loginUser(this.userObject).pipe(
        finalize(() => this.isLoading = false)
      )),
      takeUntil(this.destroy$)
    )
    .subscribe({

      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        this.authService.setUser(res.user);

        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.dialog.open(AlertDialogComponent, {
          data: {
            title: 'Error',
            message: err.error.message,
            type: 'error'
          },
          width: '420px',
          disableClose: false,
          panelClass: 'mat-dialog-clean'
        });
      }

    });
  }
  login() {
    this.loginClick$.next();
  //   this.loginService.loginUser(this.userObject)
  //     .subscribe({

  //       next: (res) => {
  //         localStorage.setItem('token', res.token);
  //         localStorage.setItem('user', JSON.stringify(res.user));
  //         this.authService.setUser(res.user);
  //         this.router.navigate(['/dashboard']);
  //       },

  //       error: err => {

  //         this.dialog.open(AlertDialogComponent, {
  //           data: { title: "Error", message: err.error.message, type: 'error' },
  //           width: '420px',
  //           disableClose: false,
  //           panelClass: 'mat-dialog-clean'
  //         });

  //       }

  //     });

  }
  ngOnDestroy(): void {
    this.destroy$.next();
  this.destroy$.complete();
  }
}
