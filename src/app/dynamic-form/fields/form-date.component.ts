import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../models/field-config.interface';
import flatpickr from 'flatpickr';

@Component({
  selector: 'app-form-date',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-date.component.html',
  styleUrl: './form-date.component.css'
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
