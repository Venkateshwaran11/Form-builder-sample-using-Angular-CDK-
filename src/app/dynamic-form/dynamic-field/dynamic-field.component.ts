import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../models/field-config.interface';
import { FormInputComponent } from '../fields/form-input.component';
import { FormSelectComponent } from '../fields/form-select.component';
import { FormRadioComponent } from '../fields/form-radio.component';
import { FormDateComponent } from '../fields/form-date.component';

@Component({
  selector: 'app-dynamic-field',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormInputComponent,
    FormSelectComponent,
    FormRadioComponent,
    FormDateComponent
  ],
  template: `
    <ng-container [ngSwitch]="getComponentType(field.type)">
      
      <app-form-input *ngSwitchCase="'input'" 
        [field]="field" [group]="group"></app-form-input>
        
      <app-form-select *ngSwitchCase="'select'" 
        [field]="field" [group]="group"></app-form-select>
        
      <app-form-radio *ngSwitchCase="'radio'" 
        [field]="field" [group]="group"></app-form-radio>
        
      <app-form-date *ngSwitchCase="'date'" 
        [field]="field" [group]="group"></app-form-date>
        
    </ng-container>
  `
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
    return 'input';
  }
}
