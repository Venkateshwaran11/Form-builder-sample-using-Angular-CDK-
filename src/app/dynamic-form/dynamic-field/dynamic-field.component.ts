import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../models/field-config.interface';
import { FormInputComponent } from '../fields/form-input.component';
import { FormSelectComponent } from '../fields/form-select.component';
import { FormRadioComponent } from '../fields/form-radio.component';
import { FormDateComponent } from '../fields/form-date.component';
import { FormFileComponent } from '../fields/form-file.component';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-dynamic-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormInputComponent,
    FormSelectComponent,
    FormRadioComponent,
    FormDateComponent,
    FormFileComponent,
    MatIcon
  ],
  styleUrls: ['./dynamic-field.component.scss'],
  templateUrl: './dynamic-field.component.html'
})
export class DynamicFieldComponent {
  @Input() field!: FieldConfig;
  @Input() group!: FormGroup;

  getComponentType(type: string): string {
    if (['text', 'textarea', 'email', 'password', 'number', 'decimal', 'currency', 'mobile'].includes(type)) {
      return 'input';
    }
    if (['dropdown', 'multiselect'].includes(type)) {
      return 'select';
    }
    if (['checkbox', 'toggle', 'radio'].includes(type)) {
      return 'radio';
    }
    if (['date', 'timestamp'].includes(type)) {
      return 'date';
    }
    if (['heading'].includes(type)) {
      return 'heading';
    }
    if (['file'].includes(type)) {
      return 'file';
    }
    return 'input';
  }
}
