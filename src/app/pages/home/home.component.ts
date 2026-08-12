import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Subscription, debounce, retry, switchMap, timer } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  apiUrl = environment.apiUrl;

  forms = signal<any[]>([]);
  searchQuery = signal<string>('');
  isLoading: boolean = true;
  searchSubject = new BehaviorSubject<string>('');
  private searchSubscription?: Subscription;

  // filteredForms = computed(() => {
  //   const query = this.searchQuery().toLowerCase();
  //   const allForms = this.forms();
  //   if (!query) return allForms;

  //   return allForms.filter(f =>
  //     f.displayName?.toLowerCase().includes(query) ||
  //     f.name?.toLowerCase().includes(query)
  //   );
  // });

  formCount = signal(0);

  ngOnInit() {
     this.searchSubject.pipe(
      debounce((query) => (query === '' ? timer(0) : timer(300))),
      switchMap((query) => {
        this.isLoading = true;
        return this.http.get<any[]>(`${this.apiUrl}/forms?name=${query}`).pipe(
          retry({
            count: 3,
            delay: (error) => {
              if (error.status === 401 || error.status === 403) {
                throw error;
              }
              console.log('Retrying...', error.status);
              return timer(2000);
            }
          })
        );
      })
    ).subscribe({
      next: (data) => {
        this.forms.set(data || []);
        this.formCount.set(this.forms().length);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading forms', err);
        this.isLoading = false;
      }
    });
  }

  loadForms() {
    this.searchSubject.next(this.searchQuery());
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchSubject.next('');
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

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}
