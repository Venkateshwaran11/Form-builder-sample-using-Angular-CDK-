import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { FieldConfig } from '../models/field-config.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-form-file',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="field-container" [formGroup]="group">
      <label [for]="field.name">{{ field.label }}<span *ngIf="field.required" class="req">*</span></label>
      
      <div class="upload-wrapper" 
           [class.dragging]="isDragging" 
           (dragover)="onDragOver($event)" 
           (dragleave)="onDragLeave()" 
           (drop)="onDrop($event)">
        
        <input 
          #fileInput
          type="file"
          [id]="field.name"
          (change)="onFileSelected($event)"
          style="display: none;"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif">
          
        <!-- Selection Area -->
        <div class="upload-area" (click)="fileInput.click()" *ngIf="!uploadedUrl && !isUploading">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <span class="upload-text">Drag & drop your file here, or <span class="browse">browse</span></span>
          <span class="upload-hint">Supports: PDF, Doc, Excel, Images (Max 10MB)</span>
        </div>

        <!-- Uploading State -->
        <div class="uploading-state" *ngIf="isUploading">
          <div class="spinner"></div>
          <span>Uploading {{ selectedFilename }}...</span>
        </div>

        <!-- Uploaded State -->
        <div class="uploaded-state" *ngIf="uploadedUrl">
          <mat-icon class="file-success-icon">check_circle</mat-icon>
          <div class="file-info">
            <span class="file-name" [title]="selectedFilename">{{ selectedFilename }}</span>
            <a [href]="getAbsoluteUrl(uploadedUrl)" target="_blank" class="view-link">View Uploaded File</a>
          </div>
          <button type="button" class="btn-icon remove-btn" (click)="removeFile()" title="Delete file">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="error-msg" *ngIf="group.get(field.name)?.touched && group.get(field.name)?.invalid">
        <span *ngIf="group.get(field.name)?.errors?.['required']">{{field.label}} is required.</span>
      </div>
    </div>
  `,
  styles: [`
    .field-container { margin-bottom: 1rem; display: flex; flex-direction: column; }
    label { font-weight: 500; margin-bottom: 0.5rem; color: #374151; font-size: 0.9rem; }
    .req { color: #ef4444; margin-left: 0.2rem; }
    
    .upload-wrapper {
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      transition: all 0.2s;
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 15px;
      box-sizing: border-box;
    }
    .upload-wrapper.dragging {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    
    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      width: 100%;
      text-align: center;
    }
    .upload-icon { font-size: 32px; width: 32px; height: 32px; color: #94a3b8; margin-bottom: 8px; }
    .upload-text { font-size: 0.9rem; color: #475569; font-weight: 500; }
    .browse { color: #3b82f6; font-weight: 600; text-decoration: underline; }
    .upload-hint { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; }
    
    .uploading-state { display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 0.9rem; color: #475569; }
    .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    .uploaded-state { display: flex; align-items: center; gap: 12px; width: 100%; }
    .file-success-icon { color: #10b981; font-size: 28px; width: 28px; height: 28px; }
    .file-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .file-name { font-size: 0.9rem; font-weight: 600; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .view-link { font-size: 0.8rem; color: #3b82f6; text-decoration: none; font-weight: 600; align-self: flex-start; margin-top: 2px; }
    .view-link:hover { text-decoration: underline; }
    
    .btn-icon { background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0; }
    .remove-btn { color: #ef4444; }
    .remove-btn:hover { background: #fee2e2; }
    
    .error-msg { color: #dc2626; font-size: 0.8rem; margin-top: 0.3rem; }
  `]
})
export class FormFileComponent implements OnInit {
  @Input() field!: FieldConfig;
  @Input() group!: FormGroup;

  private http = inject(HttpClient);

  isDragging = false;
  isUploading = false;
  uploadedUrl = '';
  selectedFilename = '';

  ngOnInit() {
    // Load pre-filled value if editing/reviewing responses
    const existingVal = this.group.get(this.field.name)?.value;
    if (existingVal) {
      this.uploadedUrl = existingVal;
      this.selectedFilename = existingVal.substring(existingVal.lastIndexOf('/') + 1);
      // Clean unique timestamp suffix from display if present
      if (this.selectedFilename.includes('-')) {
        this.selectedFilename = this.selectedFilename.substring(this.selectedFilename.indexOf('-') + 1);
      }
    }
  }

  getAbsoluteUrl(url: string): string {
    if (url.startsWith('/')) {
      const baseApiUrl = environment.apiUrl.replace('/api', '');
      return `${baseApiUrl}${url}`;
    }
    return url;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadFile(event.dataTransfer.files[0]);
    }
  }

  uploadFile(file: File) {
    this.isUploading = true;
    this.selectedFilename = file.name;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Data = reader.result as string;
      const payload = {
        filename: file.name,
        base64: base64Data
      };

      this.http.post<any>(`${environment.apiUrl}/upload`, payload).subscribe({
        next: (res) => {
          this.uploadedUrl = res.fileUrl;
          this.group.get(this.field.name)?.setValue(res.fileUrl);
          this.group.get(this.field.name)?.markAsTouched();
          this.isUploading = false;
        },
        error: (err) => {
          console.error('File upload failed', err);
          alert('Upload failed. Please try again.');
          this.isUploading = false;
        }
      });
    };
  }

  removeFile() {
    this.uploadedUrl = '';
    this.selectedFilename = '';
    this.group.get(this.field.name)?.setValue('');
    this.group.get(this.field.name)?.markAsTouched();
  }
}
