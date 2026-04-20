import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-responses',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: '../responses/responses.component.html',
  styleUrl: '../responses/responses.component.css'
})
export class ResponsesComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  apiUrl = environment.apiUrl;

  formId: string = '';
  formDisplayName: string = 'Loading...';
  responses: any[] = [];
  tableColumns: string[] = [];
  isLoading: boolean = true;

  ngOnInit() {
    this.formId = this.route.snapshot.paramMap.get('id') || '';
    if (this.formId) {
      this.loadFormData();
      this.loadResponses();
    }
  }

  loadFormData() {
    this.http.get<any[]>(`${this.apiUrl}/forms`).subscribe({
      next: (forms) => {
        const form = forms.find(f => f._id === this.formId || f.name === this.formId);
        if (form) {
          this.formDisplayName = form.displayName;
        } else {
          this.formDisplayName = this.formId;
        }
      }
    });
  }

  loadResponses() {
    this.isLoading = true;
    this.http.get<any[]>(`${this.apiUrl}/responses/${this.formId}`).subscribe({
      next: (data) => {
        this.responses = data;
        this.extractColumns();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading responses', err);
        this.isLoading = false;
      }
    });
  }

  extractColumns() {
    if (this.responses.length === 0) return;
    
    // Extract unique keys from all response data objects to form table columns
    const keys = new Set<string>();
    this.responses.forEach(res => {
      if (res.data) {
        Object.keys(res.data).forEach(k => keys.add(k));
      }
    });
    this.tableColumns = Array.from(keys);
  }

  formatData(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
