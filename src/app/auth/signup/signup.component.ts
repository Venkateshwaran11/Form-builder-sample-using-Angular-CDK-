import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  public formGroup: FormGroup;
  public showPassword = false;
  public isLoading = false;
  private apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.formGroup = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  signUp(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const payload = {
      username: this.formGroup.value.username.trim(),
      email: this.formGroup.value.email.trim(),
      password: this.formGroup.value.password
    };

    this.http.post(`${this.apiUrl}/auth/register`, payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const dialogRef = this.dialog.open(AlertDialogComponent, {
          data: {
            title: 'Account Created!',
            message: res.message || 'Your account has been created. A confirmation email with your credentials has been sent to your email address.',
            type: 'success',
            closeText: 'Proceed to Login'
          },
          width: '440px',
          disableClose: false,
          panelClass: 'mat-dialog-clean'
        });

        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/']);
        });
      },
      error: (err: any) => {
        this.isLoading = false;
        const errorMessage = err.error?.message || 'Failed to create account. Please check your details and try again.';
        this.dialog.open(AlertDialogComponent, {
          data: {
            title: 'Registration Error',
            message: errorMessage,
            type: 'error'
          },
          width: '420px',
          disableClose: false,
          panelClass: 'mat-dialog-clean'
        });
      }
    });
  }
}
