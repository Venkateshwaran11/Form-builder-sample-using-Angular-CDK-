import { Component, inject, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { FormService } from '../../services/form.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

export interface assignedUserList {
  userId: string;
  userEmail: string;
  role: string;
}
@Component({
  selector: 'app-form-access-control',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatOption, FormsModule, MatDialogModule],
  templateUrl: './form-access-control.component.html',
  styleUrl: './form-access-control.component.css'
})

export class FormAccessControlComponent {
  @Input() formId :string='';
  selectedVisibility: 'public' | 'restricted' | 'private' = 'public';
  @Input() assignedUserList : assignedUserList[] = [];
  @Output() assignedUserListChange = new EventEmitter<assignedUserList[]>();

  formService = inject(FormService);
  snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  roleList = [
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer' },
    { label: 'Respondent', value: 'respondent' }
  ];

  email = signal('');
  selectedRole: string = 'editor';
  isLoading = signal(false);
  loadingMessage = signal('Assigning user...');

  get shareableUrl(): string {
    return window.location.origin + this.router.serializeUrl(
      this.router.createUrlTree(['/f', this.formId])
    );
  }

  copyLink() {
    navigator.clipboard.writeText(this.shareableUrl);
    this.snackbar.success('Link copied to clipboard!');
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
    this.loadingMessage.set('Assigning user...');
    this.isLoading.set(true);
    this.formService.assignUser(payload).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.email.update(() => '');
        accessform.control.markAsUntouched();
        this.assignedUserList = response['assignedUserList'] || [];
        this.assignedUserListChange.emit(this.assignedUserList);
        this.snackbar.success('User assigned successfully');
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error assigning user:', error);
        this.snackbar.error(error?.error?.error || 'Error assigning user');
      }
    });
  }

  removeUser(user: assignedUserList) {
    if (user.role === 'owner') {
      this.snackbar.error('Cannot remove the form owner');
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove Collaborator',
        message: `Are you sure you want to remove ${user.userEmail} from this form? They will lose access to collaborate or view this form.`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        type: 'danger'
      },
      width: '420px',
      disableClose: true,
      panelClass: 'mat-dialog-clean'
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const payload = {
          formId: this.formId,
          userId: user.userId,
          email: user.userEmail
        };

        this.loadingMessage.set('Removing collaborator...');
        this.isLoading.set(true);
        this.formService.unassignUser(payload).subscribe({
          next: (response: any) => {
            this.isLoading.set(false);
            this.assignedUserList = response['assignedUserList'] || [];
            this.assignedUserListChange.emit(this.assignedUserList);
            this.snackbar.success('Collaborator removed successfully');
          },
          error: (error) => {
            this.isLoading.set(false);
            console.error('Error removing collaborator:', error);
            this.snackbar.error(error?.error?.error || 'Failed to remove collaborator');
          }
        });
      }
    });
  }
}
