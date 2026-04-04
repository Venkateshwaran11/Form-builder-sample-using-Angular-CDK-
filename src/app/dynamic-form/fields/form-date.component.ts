import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../models/field-config.interface';
import flatpickr from 'flatpickr';

@Component({
  selector: 'app-form-date',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="field-container" [formGroup]="group">
      <label [for]="field.name">{{ field.label }}<span *ngIf="field.required" class="req">*</span></label>
      
      <div class="input-wrapper">
        <input 
          #dateInput
          type="text"
          [id]="field.name"
          [placeholder]="field.placeholder || 'Select Date...'">
        <span class="icon">📅</span>
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
    .input-wrapper { position: relative; display: flex; align-items: center; }
    input { width: 100%; padding: 0.6rem 0.6rem 0.6rem 2.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit; font-size: 0.9rem; }
    input:focus { border-color: #3b82f6; outline: none; }
    .icon { position: absolute; left: 0.6rem; color: #6b7280; font-size: 1rem; pointer-events: none; }
    .error-msg { color: #dc2626; font-size: 0.8rem; margin-top: 0.3rem; }
  `]
})
export class FormDateComponent implements AfterViewInit, OnDestroy {
  @Input() field!: FieldConfig;
  @Input() group!: FormGroup;
  @ViewChild('dateInput') dateInput!: ElementRef;
  fpInstance: any;

  ngAfterViewInit() {
    // Small delay to allow element rendering
    setTimeout(() => {
      const isTimestamp = this.field.type === 'timestamp';
      this.fpInstance = flatpickr(this.dateInput.nativeElement, {
        enableTime: isTimestamp,
        dateFormat: isTimestamp ? 'Y-m-d H:i' : 'Y-m-d',
        defaultDate: this.group.get(this.field.name)?.value || null,
        onChange: (selectedDates, dateStr) => {
          this.group.get(this.field.name)?.setValue(dateStr);
          this.group.get(this.field.name)?.markAsTouched();
        }
      });
      
      // Keep flatpickr manually in sync if form is updated externally
      this.group.get(this.field.name)?.valueChanges.subscribe(val => {
        if (!val) {
          this.fpInstance.clear();
        } else {
          this.fpInstance.setDate(val);
        }
      });
    }, 0);
  }

  ngOnDestroy() {
    if (this.fpInstance) {
      this.fpInstance.destroy();
    }
  }
}
