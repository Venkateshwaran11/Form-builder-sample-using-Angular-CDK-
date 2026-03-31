import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../models/field-config.interface';

@Component({
  selector: 'app-form-radio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="field-container" [formGroup]="group">
      <label class="group-label">{{ field.label }}<span *ngIf="field.required" class="req">*</span></label>
      
      <ng-container [ngSwitch]="field.type">
        <!-- Radio Buttons -->
        <div *ngSwitchCase="'radio'" class="options-container">
          <label class="inline-option" *ngFor="let option of field.options">
            <input type="radio" [formControlName]="field.name" [value]="option.value">
            {{ option.label }}
          </label>
        </div>

        <!-- Checkbox -->
        <div *ngSwitchCase="'checkbox'" class="options-container">
          <label class="inline-option">
            <input type="checkbox" [formControlName]="field.name">
            {{ field.placeholder || 'Enable ' + field.label }}
          </label>
        </div>

        <!-- Toggle (Boolean) -->
        <div *ngSwitchCase="'toggle'" class="toggle-container">
          <label class="toggle-switch">
            <input type="checkbox" [formControlName]="field.name">
            <span class="slider"></span>
          </label>
          <span class="toggle-label">{{ group.get(field.name)?.value ? 'ON' : 'OFF' }}</span>
        </div>
      </ng-container>

      <div class="error-msg" *ngIf="group.get(field.name)?.touched && group.get(field.name)?.invalid">
        <span *ngIf="group.get(field.name)?.errors?.['required']">This field is required.</span>
      </div>
    </div>
  `,
  styles: [`
    .field-container { margin-bottom: 1rem; display: flex; flex-direction: column; }
    .group-label { font-weight: 500; margin-bottom: 0.5rem; color: #374151; font-size: 0.9rem; }
    .req { color: #ef4444; margin-left: 0.2rem; }
    .options-container { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .inline-option { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.9rem; color: #4b5563; }
    
    .toggle-container { display: flex; align-items: center; gap: 12px; }
    .toggle-switch { position: relative; width: 44px; height: 24px; display: inline-block; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
    input:checked + .slider { background-color: #3b82f6; }
    input:checked + .slider:before { transform: translateX(20px); }
    .toggle-label { font-size: 0.85rem; font-weight: 600; color: #3b82f6; width: 30px; }
    
    .error-msg { color: #dc2626; font-size: 0.8rem; margin-top: 0.3rem; }
  `]
})
export class FormRadioComponent {
  @Input() field!: FieldConfig;
  @Input() group!: FormGroup;
}
