import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { FieldConfig } from './dynamic-form/models/field-config.interface';
import { MatIconModule } from '@angular/material/icon';

import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, DragDropModule, MatIconModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  implements OnInit{
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  ngOnInit(): void {
    this.loadSavedForms();
    this.formConfig = [];
  }
  mode: 'edit' | 'view' = 'edit';

  toggleMode() {
    this.mode = this.mode === 'edit' ? 'view' : 'edit';
    if (this.mode === 'edit') this.submittedData = null;
  }

  isDirty: boolean = false;
  searchQuery: string = '';
  showSearchPopover: boolean = false;
  savedForms: any[] = [];

  get filteredForms() {
    if (!this.searchQuery) {
      return this.savedForms.slice(0, 5); // Show top 5 recent forms
    }
    const query = this.searchQuery.toLowerCase();
    return this.savedForms.filter(f => 
      f.displayName.toLowerCase().includes(query) || 
      f.name.toLowerCase().includes(query)
    );
  }

  loadSavedForms() {
    this.http.get<any[]>(`${this.apiUrl}/forms`).subscribe({
      next: (forms) => {
        this.savedForms = forms
      },
      error: (err) => console.error('Error loading forms:', err)
    });
  }

  exportConfig() {
    const configJson = JSON.stringify(this.formConfig, null, 2);
    console.log('Exported Form Configuration:', configJson);
    alert('Form configuration exported to console.');
  }

  clearConfig() {
    if (confirm('Are you sure you want to clear the entire form? This action cannot be undone.')) {
      this.formConfig = [];
      this.isDirty = true;
    }
  }

  createNewForm() {
    if (this.isDirty && !confirm('You have unsaved changes. Are you sure you want to start a new form?')) {
      return;
    }
    this.formConfig = [];
    this.formName = 'untitled_form';
    this.formDisplayName = 'Untitled Form';
    this.isDirty = false;
    this.submittedData = null;
    this.id='';
    alert('Started a new fresh form!');
  }
  id='';
  saveConfig() {
    const formData = {
      name: this.formName,
      displayName: this.formDisplayName,
      config: this.formConfig,
      _id:this.id
    };

    this.http.post(`${this.apiUrl}/forms`, formData).subscribe({
      next: () => {
        this.isDirty = false;
        this.loadSavedForms();
        alert('Form saved successfully to Backend!');
      },
      error: (err) => {
        console.error('Error saving form:', err);
        alert('Failed to save form to backend.');
      }
    });
  }

  loadForm(form: any) {
    if (this.isDirty && !confirm('You have unsaved changes. Are you sure you want to load another form?')) {
      return;
    }
    this.formConfig = [...form.config];
    this.formName = form.name;
    this.formDisplayName = form.displayName;
    this.isDirty = false;
    this.showSearchPopover = false;
    this.searchQuery = '';
    this.id=form._id;
  }

  deleteForm(event: Event, formName: string) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete form "${formName}"?`)) {
      this.http.delete(`${this.apiUrl}/forms/${formName}`).subscribe({
        next: () => {
          this.loadSavedForms();
          alert('Form deleted from backend.');
        },
        error: (err) => console.error('Error deleting form:', err)
      });
    }
  }
  tabs = [
  { id: 'tab1', label: 'Fields' },
  { id: 'tab2', label: 'Actions' },
  // { id: 'tab3', label: 'Review' }
];

activeTab = this.tabs[0].id;
  availableTools = [
    { type: 'text', label: 'Text Input', icon: "edit",class:"btn-icon edit-btn" },
    { type: 'textarea', label: 'Text Area', icon: 'description' },
    { type: 'email', label: 'Email', icon: 'email' },
    { type: 'password', label: 'Password', icon: 'lock' },
    { type: 'number', label: 'Number', icon: 'pin' },
    { type: 'decimal', label: 'Decimal', icon: 'calculate' },
    { type: 'date', label: 'Date Picker', icon: 'calendar_today' },
    { type: 'timestamp', label: 'Date & Time (Timestamp)', icon: 'schedule' },
    { type: 'dropdown', label: 'Dropdown Select', icon: 'arrow_drop_down' },
    { type: 'multiselect', label: 'Multi-Select', icon: 'check_box_outline_blank' },
    { type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
    { type: 'radio', label: 'Radio Buttons', icon: 'radio_button_checked' },
    { type: 'toggle', label: 'Boolean', icon: 'toggle_on' }
  ];

  formConfig: FieldConfig[] = []; // Starts functionally empty
  submittedData: any = null;
  formName: string = 'untitled_form';
  formDisplayName: string = 'Untitled Form';

  onFormSubmit(value: any) {
    const finalData = { 
      formId: this.formName, 
      data: value 
    };

    console.log('Persisting Form Submission ->', finalData);
    
    this.http.post(`${this.apiUrl}/responses`, finalData).subscribe({
      next: (res) => {
        console.log('Submission successful:', res);
        this.submittedData = value; // Keep for UI display
        alert('Form submitted and saved to database!');
      },
      error: (err) => {
        console.error('Submission error:', err);
        alert('Failed to submit form to backend.');
      }
    });
  }

  onConfigChange(newConfig: FieldConfig[]) {
    this.formConfig = newConfig;
    this.isDirty = true;
    console.log('Form Config Structure Updated ->', this.formConfig);
  }
}