import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../models/field-config.interface';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="field-container" [formGroup]="group">
      <label [for]="field.name">{{ field.label }}<span *ngIf="field.required" class="req">*</span></label>
      
      <ng-container [ngSwitch]="field.type">
        <!-- Textarea -->
        <textarea *ngSwitchCase="'textarea'"
          [id]="field.name"
          [formControlName]="field.name"
          [placeholder]="field.placeholder || ''"
          [maxlength]="field.max || null">
        </textarea>
        
        <!-- Standard Inputs -->
        <input *ngSwitchDefault
          [type]="getInputType(field.type)"
          [id]="field.name"
          [formControlName]="field.name"
          [placeholder]="field.placeholder || ''"
          [min]="field.min || null"
          [max]="field.max || null"
          (input)="limitDecimal($event, field.precision)">
      </ng-container>

      <div class="error-msg" *ngIf="group.get(field.name)?.touched && group.get(field.name)?.invalid">
        <span *ngIf="group.get(field.name)?.errors?.['required']">{{field.label}} is required.</span>
        <span *ngIf="group.get(field.name)?.errors?.['email']">Invalid email format.</span>
        <span *ngIf="group.get(field.name)?.errors?.['pattern']">{{ field.errorMessage || 'Invalid format.' }}</span>
        <span *ngIf="group.get(field.name)?.errors?.['min']">Minimum is {{ field.min }}.</span>
        <span *ngIf="group.get(field.name)?.errors?.['max']">Maximum is {{ field.max }}.</span>
      </div>
    </div>
  `,
  styles: [`
    .field-container { margin-bottom: 1rem; display: flex; flex-direction: column; }
    label { font-weight: 500; margin-bottom: 0.5rem; color: #374151; font-size: 0.9rem; }
    .req { color: #ef4444; margin-left: 0.2rem; }
    input, textarea { padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 0.9rem; transition: border-color 0.2s; }
    input:focus, textarea:focus { border-color: #3b82f6; outline: none; }
    .error-msg { color: #dc2626; font-size: 0.8rem; margin-top: 0.3rem; }
  `]
})
export class FormInputComponent {
  @Input() field!: FieldConfig;
  @Input() group!: FormGroup;

  getInputType(type: string): string {
    console.log(this.field,this.group)
    switch (type) {
      case 'password': return 'password';
      case 'email': return 'email';
      case 'number':
      case 'decimal': 
      case 'currency': return 'number';
      case 'mobile': return 'tel';
      default: return 'text';
    }
  }
  limitDecimal(event: any,precision:number|undefined) {
    if(!precision){
      return;
    }
  let value = event.target.value;
  if (value.includes('.')) {
    let [int, dec] = value.split('.');
    if (dec.length > precision) {
      event.target.value = int + '.' + dec.substring(0, precision);
    }
  }
}
}
