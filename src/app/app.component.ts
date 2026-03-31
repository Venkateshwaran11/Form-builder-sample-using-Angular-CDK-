import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { FieldConfig } from './dynamic-form/models/field-config.interface';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, DragDropModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  implements OnInit{
  ngOnInit(): void {
    this.formConfig = [
    // {
    //   type: 'text',
    //   label: 'Full Name',
    //   name: 'full_name',
    //   required: true,
    //   width: '100%'
    // },
    // {
    //   type: 'email',
    //   label: 'Email Address',
    //   name: 'email',
    //   required: true,
    //   width: '100%'
    // },
    // {
    //   type: 'number',
    //   label: 'Age',
    //   name: 'age',
    //   required: false,
    //   width: '50%',
    //   min: 18,
    //   max: 99
    // },
    // {
    //   type: 'dropdown',
    //   label: 'Country',
    //   name: 'country',
    //   required: true,
    //   width: '50%',
    //   options: [
    //     { label: 'India', value: 'in' },
    //     { label: 'United States', value: 'us' },
    //     { label: 'United Kingdom', value: 'uk' }
    //   ]
    // },
    // {
    //   type: 'checkbox',
    //   label: 'I agree to the terms and conditions',
    //   name: 'terms',
    //   required: true,
    //   width: '100%'
    // }
  ];
  }
  mode: 'edit' | 'view' = 'edit';

  toggleMode() {
    this.mode = this.mode === 'edit' ? 'view' : 'edit';
    if (this.mode === 'edit') this.submittedData = null;
  }

  availableTools = [
    { type: 'text', label: 'Text Input', icon: "edit",class:"btn-icon edit-btn" },
    { type: 'textarea', label: 'Text Area', icon: 'description' },
    { type: 'email', label: 'Email', icon: 'email' },
    { type: 'password', label: 'Password', icon: 'lock' },
    { type: 'number', label: 'Number', icon: 'numbers' },
    { type: 'date', label: 'Date Picker', icon: 'calendar_today' },
    { type: 'timestamp', label: 'Date & Time (Timestamp)', icon: 'schedule' },
    { type: 'dropdown', label: 'Dropdown Select', icon: 'arrow_drop_down' },
    { type: 'multiselect', label: 'Multi-Select', icon: 'check_box_outline_blank' },
    { type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
    { type: 'radio', label: 'Radio Buttons', icon: 'radio_button_checked' },
    { type: 'toggle', label: 'Toggle Switch', icon: 'toggle_on' }
  ];

  formConfig: FieldConfig[] = []; // Starts functionally empty
  submittedData: any = null;
  formName: string = 'my_dynamic_form';
  formDisplayName: string = 'New Dynamic Form';

  onFormSubmit(value: any) {
    this.formName = localStorage.getItem('dynamicFormName')||'my_dynamic_form';
    this.formDisplayName = localStorage.getItem('dynamicFormDisplayName') || 'New Dynamic Form';
    const finalData = { ...value, type: this.formName };
    console.log('Resulting Form JSON Values ->', finalData);
    this.submittedData = finalData;
  }

  onConfigChange(newConfig: FieldConfig[]) {
    this.formConfig = newConfig;
    console.log('Form Config Structure Updated ->', this.formConfig);
  }
}