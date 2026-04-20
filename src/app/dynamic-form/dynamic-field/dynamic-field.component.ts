import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig } from '../models/field-config.interface';
import { FormInputComponent } from '../fields/form-input.component';
import { FormSelectComponent } from '../fields/form-select.component';
import { FormRadioComponent } from '../fields/form-radio.component';
import { FormDateComponent } from '../fields/form-date.component';
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
    MatIcon
],
  styles: [`
    .heading {
    display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #222;
  margin-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 8px;
    }
    .heading mat-icon {
  font-size: 28px;
  width: 28px;
  height: 28px;
  color: #3f51b5;
}

.align-left {
  justify-content: flex-start;
  text-align: left;
}

.align-center {
  justify-content: center;
  text-align: center;
}

.align-right {
  justify-content: flex-end;
  text-align: right;
}

  `],
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

      <div *ngSwitchCase="'heading'" class="heading" [ngClass]="{
        'align-left': field.headingTextAlignment === 'left',
        'align-center': field.headingTextAlignment === 'center',
        'align-right': field.headingTextAlignment === 'right'
      }">
        <mat-icon>view_headline </mat-icon>
        <span>{{ field.label }}</span>
      </div>
        
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
    if (['heading'].includes(type)) {
      return 'heading';
    }
    return 'input';
  }
}
