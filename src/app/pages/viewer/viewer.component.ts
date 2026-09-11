import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DynamicFormComponent } from '../../dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../dynamic-form/models/field-config.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [CommonModule, MatIconModule, DynamicFormComponent],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.css'
  /*
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow-y: auto;
      background: #f1f5f9;
      align-items: center;
    }
    
    .viewer-container {
      width: 100%;
      max-width: 700px;
      padding: 40px 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 40px;
      margin-bottom: 40px;
    }

    .viewer-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .form-header {
      padding: 40px 40px 20px;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }

    .brand-icon {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      padding: 12px;
      border-radius: 12px;
      font-size: 28px;
      width: 28px;
      height: 28px;
      margin-bottom: 20px;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
    }

    .form-title {
      margin: 0 0 10px;
      color: #0f172a;
      font-size: 1.8rem;
      font-weight: 800;
    }

    .form-subtitle {
      margin: 0;
      color: #64748b;
      font-size: 1rem;
    }

    .form-body {
      padding: 30px 40px 40px;
    }

    .success-card, .loading-card, .error-card {
      padding: 60px 40px;
      text-align: center;
      align-items: center;
    }

    .success-icon mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #10b981;
      margin-bottom: 20px;
    }

    .error-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ef4444;
      margin-bottom: 20px;
    }

    .spin-icon {
      animation: spin 1s linear infinite;
      color: #3b82f6;
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 15px;
    }

    h2 { font-size: 1.5rem; color: #1e293b; margin: 0 0 10px; }
    p { color: #64748b; margin: 0; }

    
    .return-btn {
      margin-top: 30px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .return-btn:hover { background: #e2e8f0; color: #0f172a; }

    .watermark {
      text-align: center;
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    @keyframes spin { 100% { transform: rotate(360deg); } }
  */
})
export class ViewerComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  
  apiUrl = environment.apiUrl;
  formId: string = '';
  
  formName: string = '';
  formDisplayName: string = '';
  formConfig: FieldConfig[] = [];
  
  isLoading = true;
  isSubmitted = false;
  errorMessage = '';

  ngOnInit() {
    this.formId = this.route.snapshot.paramMap.get('id') || '';
    if (this.formId) {
      this.loadForm();
    } else {
      this.errorMessage = 'No form identifier provided.';
      this.isLoading = false;
    }

    // Explicitly hide the Flowise Admin Chatbot in the generic viewer route
    const style = document.createElement('style');
    style.id = 'hide-flowise-viewer';
    style.innerHTML = 'flowise-chatbot { display: none !important; }';
    document.head.appendChild(style);
  }

  ngOnDestroy() {
    document.getElementById('hide-flowise-viewer')?.remove();
  }

  loadForm() {
    this.http.get<any[]>(`${this.apiUrl}/forms/${this.formId}`).subscribe({
      next: (form:any) => {
        if (form) {
          this.formConfig = form.config || [];
          this.formName = form.name;
          this.formDisplayName = form.displayName || 'Untitled Form';
        } else {
          this.errorMessage = 'This form could not be found or has been removed.';
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load form details from the server.';
        this.isLoading = false;
      }
    });
  }

  onFormSubmit(value: any) {
    const finalData = { formId: this.formId, data: value };
    this.http.post(`${this.apiUrl}/responses`, finalData).subscribe({
      next: () => {
        this.isSubmitted = true;
      },
      error: () => {
        alert('Could not submit the form. Please try again.');
      }
    });
  }

  resetForm() {
    this.isSubmitted = false;
    // Trigger reset on the dynamic form visually by creating a clone of the array to trigger change detection
    this.formConfig = [...this.formConfig];
  }
}
