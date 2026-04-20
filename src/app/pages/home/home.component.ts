import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  apiUrl = environment.apiUrl;

  forms: any[] = [];
  searchQuery: string = '';
  isLoading: boolean = true;

  ngOnInit() {
    this.loadForms();
  }

  get filteredForms() {
    if (!this.searchQuery) return this.forms;
    const query = this.searchQuery.toLowerCase();
    return this.forms.filter(f => 
      f.displayName?.toLowerCase().includes(query) || 
      f.name?.toLowerCase().includes(query)
    );
  }

  loadForms() {
    this.isLoading = true;
    this.http.get<any[]>(`${this.apiUrl}/forms`).subscribe({
      next: (data) => {
        this.forms = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading forms', err);
        this.isLoading = false;
      }
    });
  }

  createNewForm() {
    this.router.navigate(['/builder/new']);
  }

  editForm(form: any) {
    this.router.navigate(['/builder', form._id || form.name]);
  }

  viewResponses(form: any) {
    this.router.navigate(['/responses', form._id || form.name]);
  }

  shareForm(form: any, event: Event) {
    event.stopPropagation();
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/f', form._id || form.name])
    );
    window.open(url, '_blank');
  }

  deleteForm(form: any, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete ${form.displayName}?`)) {
      this.http.delete(`${this.apiUrl}/forms/${form.name}`).subscribe({
        next: () => this.loadForms(),
        error: (err) => console.error('Error deleting form', err)
      });
    }
  }
}
