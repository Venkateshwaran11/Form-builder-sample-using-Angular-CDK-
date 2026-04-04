import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface AlertDialogData {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  closeText?: string;
}

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <mat-dialog-content class="dialog-body">
        <div class="dialog-icon-wrap" [ngClass]="data.type || 'info'">
          <mat-icon>{{ iconMap[data.type || 'info'] }}</mat-icon>
        </div>
        <h2 class="dialog-title">{{ data.title }}</h2>
        <p class="dialog-message">{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="center" class="dialog-actions">
        <button mat-flat-button
          [ngClass]="'btn-' + (data.type || 'info')"
          (click)="dialogRef.close()">
          {{ data.closeText || 'OK' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-container { min-width: 340px; max-width: 460px; }

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
      width: 62px; height: 62px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .dialog-icon-wrap mat-icon { font-size: 30px; width: 30px; height: 30px; }
    .dialog-icon-wrap.success { background: #d1fae5; color: #059669; }
    .dialog-icon-wrap.error   { background: #fee2e2; color: #dc2626; }
    .dialog-icon-wrap.info    { background: #dbeafe; color: #2563eb; }
    .dialog-icon-wrap.warning { background: #fef3c7; color: #d97706; }

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

    .dialog-actions { padding: 8px 0 4px !important; }

    .btn-success { background: #10b981 !important; color: white !important; min-width: 100px; }
    .btn-error   { background: #ef4444 !important; color: white !important; min-width: 100px; }
    .btn-info    { background: #3b82f6 !important; color: white !important; min-width: 100px; }
    .btn-warning { background: #f59e0b !important; color: white !important; min-width: 100px; }
  `]
})
export class AlertDialogComponent {
  iconMap: Record<string, string> = {
    success: 'check_circle_outline',
    error:   'error_outline',
    info:    'info_outline',
    warning: 'warning_amber'
  };

  constructor(
    public dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogData
  ) {}
}
