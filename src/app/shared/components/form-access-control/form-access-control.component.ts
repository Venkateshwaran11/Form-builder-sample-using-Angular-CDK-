import { Component, inject, Input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';

import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { FormService } from '../../services/form.service';
import { SnackbarService } from '../../services/snackbar.service';

interface assignedUserList{
  userId: string;
  userEmail: string;
  role: string;
}
@Component({
  selector: 'app-form-access-control',
  standalone: true,
  imports: [MatIconModule, MatOption, FormsModule],
  templateUrl: './form-access-control.component.html',
  styleUrl: './form-access-control.component.css'
})

export class FormAccessControlComponent {
  @Input() formId :string='';
  selectedVisibility: 'public' | 'restricted' | 'private' = 'public';
  @Input() assignedUserList : assignedUserList[] = [];
  formService = inject(FormService);
  snackbar = inject(SnackbarService);
  roleList = [
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer' },
    { label: 'Respondent', value: 'respondent' }
  ];

  email = signal('')
  selectedRole: string = 'editor';
  private router = inject(Router);

   copyUrl = signal(window.location.origin + this.router.serializeUrl(
      this.router.createUrlTree(['/f', this.formId])
    )).asReadonly();

  copyLink() {
    const url = window.location.origin + this.router.serializeUrl(
      this.router.createUrlTree(['/f', this.formId])
    );
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }

  saveUSer(accessform: NgForm) {
    if (accessform.invalid) {
      accessform.control.markAllAsTouched();
      return;
    }
    const payload = {
      email: this.email(),
      role: this.selectedRole,
      formId: this.formId
    };
    this.formService.assignUser(payload).subscribe({
      next: (response:any) => {
        this.email.update(() => '');
        accessform.control.markAsUntouched();
        this.assignedUserList = response['assignedUserList'];
        console.log('User assigned successfully:', response);
        this.snackbar.success('User assigned successfully');
      },
      error: (error) => {
        console.error('Error assigning user:', error);
        this.snackbar.error('Error assigning user');
      }
    });
  }
}
