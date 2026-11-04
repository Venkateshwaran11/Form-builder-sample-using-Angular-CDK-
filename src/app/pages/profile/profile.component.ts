import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService, CustomField, UserProfile } from '../../services/profile.service';
import { AuthService } from '../../core/analytics/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  isLoading = true;
  isSaving = false;
  isUploadingPhoto = false;

  userProfile: UserProfile = {
    _id: '',
    username: '',
    email: '',
    role: 'user',
    profileImage: '',
    bio: '',
    phone: '',
    designation: '',
    department: '',
    organization: '',
    location: '',
    customFields: []
  };

  // Password change state
  showPasswordSection = false;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  showCurrentPassword = false;
  showNewPassword = false;

  // Preset suggestions for additional fields
  quickFieldPresets = [
    { label: 'Employee ID', type: 'text' as const },
    { label: 'LinkedIn Profile', type: 'url' as const },
    { label: 'GitHub Profile', type: 'url' as const },
    { label: 'Department Code', type: 'text' as const },
    { label: 'Date of Birth', type: 'date' as const },
    { label: 'Emergency Contact', type: 'text' as const },
    { label: 'Work Location / Desk', type: 'text' as const }
  ];

  // Backup for discard / reset
  private initialDataString = '';

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.user) {
          this.applyUserData(res.user);
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Fallback to authService.currentUser if API temporarily unavailable
        const cached = this.authService.currentUser();
        if (cached) {
          this.applyUserData(cached);
        } else {
          this.snackbar.error(err.error?.message || 'Failed to load profile details.');
        }
      }
    });
  }

  private applyUserData(user: any): void {
    this.userProfile = {
      _id: user._id || '',
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'user',
      profileImage: user.profileImage || '',
      bio: user.bio || '',
      phone: user.phone || '',
      designation: user.designation || '',
      department: user.department || '',
      organization: user.organization || '',
      location: user.location || '',
      customFields: Array.isArray(user.customFields)
        ? user.customFields.map((cf: any) => ({
            id: cf.id || ('cf_' + Math.random().toString(36).substring(2, 9)),
            key: cf.key || '',
            label: cf.label || '',
            value: cf.value || '',
            type: cf.type || 'text'
          }))
        : [],
      isActive: user.isActive !== undefined ? user.isActive : true,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    this.initialDataString = JSON.stringify(this.userProfile);
  }

  // --- Additional Custom Fields Management ---
  addCustomField(label: string = '', type: 'text' | 'number' | 'date' | 'url' | 'email' = 'text'): void {
    if (!this.userProfile.customFields) {
      this.userProfile.customFields = [];
    }

    const newField: CustomField = {
      id: 'cf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      key: label ? label.toLowerCase().replace(/\s+/g, '_') : '',
      label: label,
      value: '',
      type: type
    };

    this.userProfile.customFields.push(newField);
  }

  addPresetField(preset: { label: string; type: 'text' | 'number' | 'date' | 'url' | 'email' }): void {
    const exists = this.userProfile.customFields?.some(
      cf => cf.label.toLowerCase() === preset.label.toLowerCase()
    );

    if (exists) {
      this.snackbar.info(`"${preset.label}" field already added.`);
      return;
    }

    this.addCustomField(preset.label, preset.type);
    this.snackbar.info(`Added "${preset.label}" field.`);
  }

  removeCustomField(index: number): void {
    if (this.userProfile.customFields && index >= 0 && index < this.userProfile.customFields.length) {
      const removed = this.userProfile.customFields.splice(index, 1);
      this.snackbar.info(`Field "${removed[0]?.label || 'Custom field'}" removed.`);
    }
  }

  onFieldLabelChange(field: CustomField): void {
    if (field.label) {
      field.key = field.label.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }
  }

  // --- Photo Upload Management (Base64 Data URI) ---
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    // Check file size (max 2MB for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      this.snackbar.error('Image size must be less than 2MB.');
      return;
    }

    this.isUploadingPhoto = true;
    const reader = new FileReader();
    reader.onload = () => {
      this.isUploadingPhoto = false;
      this.userProfile.profileImage = reader.result as string;
      this.snackbar.success('Profile photo loaded. Click "Save Changes" to save.');
    };
    reader.onerror = () => {
      this.isUploadingPhoto = false;
      this.snackbar.error('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.userProfile.profileImage = '';
    this.snackbar.info('Profile photo cleared. Click "Save Changes" to apply.');
  }

  // --- Save & Discard Actions ---
  saveProfile(): void {
    if (!this.userProfile.username.trim()) {
      this.snackbar.error('Username is required.');
      return;
    }

    if (!this.userProfile.email.trim()) {
      this.snackbar.error('Email is required.');
      return;
    }

    // Validate password change if filled
    if (this.passwordData.newPassword) {
      if (!this.passwordData.currentPassword) {
        this.snackbar.error('Please enter your current password to set a new password.');
        return;
      }
      if (this.passwordData.newPassword.length < 6) {
        this.snackbar.error('New password must be at least 6 characters.');
        return;
      }
      if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
        this.snackbar.error('New password and confirmation do not match.');
        return;
      }
    }

    // Filter empty custom fields (require label)
    const sanitizedCustomFields = (this.userProfile.customFields || []).filter(
      cf => cf && cf.label && cf.label.trim()
    );

    const payload: any = {
      username: this.userProfile.username.trim(),
      email: this.userProfile.email.trim(),
      profileImage: this.userProfile.profileImage,
      bio: this.userProfile.bio,
      phone: this.userProfile.phone,
      designation: this.userProfile.designation,
      department: this.userProfile.department,
      organization: this.userProfile.organization,
      location: this.userProfile.location,
      customFields: sanitizedCustomFields
    };

    if (this.passwordData.newPassword) {
      payload.currentPassword = this.passwordData.currentPassword;
      payload.newPassword = this.passwordData.newPassword;
    }

    this.isSaving = true;
    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res && res.user) {
          this.applyUserData(res.user);
          // Reset password section
          this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
          this.showPasswordSection = false;
          this.snackbar.success('Profile and custom fields saved successfully!');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.snackbar.error(err.error?.message || 'Failed to update profile.');
      }
    });
  }

  discardChanges(): void {
    if (this.initialDataString) {
      this.applyUserData(JSON.parse(this.initialDataString));
      this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      this.showPasswordSection = false;
      this.snackbar.info('Changes discarded.');
    }
  }

  get hasChanges(): boolean {
    const currentCustomFields = (this.userProfile.customFields || []).filter(cf => cf && cf.label);
    const comparableProfile = {
      ...this.userProfile,
      customFields: currentCustomFields
    };
    return JSON.stringify(comparableProfile) !== this.initialDataString || !!this.passwordData.newPassword;
  }
}
