import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <mat-dialog-content class="dialog-body">
        <div class="dialog-icon-wrap" [ngClass]="data.type || 'warning'">
          <mat-icon>{{ iconMap[data.type || 'warning'] }}</mat-icon>
        </div>
        <h2 class="dialog-title">{{ data.title }}</h2>
        <p class="dialog-message">{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button (click)="dialogRef.close(false)" class="cancel-btn">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-flat-button
          [ngClass]="data.type === 'danger' ? 'confirm-danger' : 'confirm-primary'"
          (click)="dialogRef.close(true)">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-container { min-width: 360px; max-width: 480px; }

    .dialog-body {
      display: flex !important;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 8px 0 16px !important;
      max-height: unset !important;
      overflow: visible !important;
    }

    .dialog-icon-wrap {
      width: 60px; height: 60px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .dialog-icon-wrap mat-icon { font-size: 30px; width: 30px; height: 30px; }
    .dialog-icon-wrap.warning { background: #fef3c7; color: #d97706; }
    .dialog-icon-wrap.danger  { background: #fee2e2; color: #dc2626; }
    .dialog-icon-wrap.info    { background: #dbeafe; color: #2563eb; }

    .dialog-title {
      margin: 0 0 8px;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dialog-message {
      margin: 0;
      color: #475569;
      font-size: 0.92rem;
      line-height: 1.6;
    }

    .dialog-actions {
      padding: 8px 0 4px !important;
      gap: 10px;
    }

    .cancel-btn { color: #64748b; border-color: #e2e8f0; }
    .confirm-primary { background: #3b82f6 !important; color: white !important; }
    .confirm-danger  { background: #ef4444 !important; color: white !important; }
  `]
})
export class ConfirmDialogComponent {
  iconMap: Record<string, string> = {
    warning: 'warning_amber',
    danger: 'delete_forever',
    info: 'info_outline'
  };

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
