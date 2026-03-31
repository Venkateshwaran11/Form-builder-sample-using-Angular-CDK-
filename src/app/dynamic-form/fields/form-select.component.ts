import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../models/field-config.interface';

@Component({
  selector: 'app-form-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="field-container" [formGroup]="group">
      <label [for]="field.name">{{ field.label }}<span *ngIf="field.required" class="req">*</span></label>
      
      <select 
        [id]="field.name"
        [formControlName]="field.name"
        [multiple]="field.type === 'multiselect'">
        <option *ngIf="field.type === 'dropdown'" value="" disabled>Select {{ field.label }}</option>
        <option *ngFor="let option of field.options" [value]="option.value">
          {{ option.label }}
        </option>
      </select>

      <div class="error-msg" *ngIf="group.get(field.name)?.touched && group.get(field.name)?.invalid">
        <span *ngIf="group.get(field.name)?.errors?.['required']">This field is required.</span>
      </div>
    </div>
  `,
  styles: [`
    .field-container { margin-bottom: 1rem; display: flex; flex-direction: column; }
    label { font-weight: 500; margin-bottom: 0.5rem; color: #374151; font-size: 0.9rem; }
    .req { color: #ef4444; margin-left: 0.2rem; }
    select { padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 0.9rem; background: #fff; }
    select:focus { border-color: #3b82f6; outline: none; }
    select[multiple] { height: 120px; }
    .error-msg { color: #dc2626; font-size: 0.8rem; margin-top: 0.3rem; }
  `]
})
export class FormSelectComponent {
  @Input() field!: FieldConfig;
  @Input() group!: FormGroup;
}
