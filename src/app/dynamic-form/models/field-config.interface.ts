import { ValidatorFn } from '@angular/forms';

export type FieldType = 
  'text' | 'textarea' | 'email' | 'password' | 
  'number' | 'decimal' | 'currency' | 'mobile' |
  'date' | 'timestamp' | 
  'checkbox' | 'toggle' | 'radio' | 
  'dropdown' | 'multiselect';

export interface FieldOption {
  label: string;
  value: any;
}

export interface FieldConfig {
  type: FieldType;
  name: string;
  label: string;
  value?: any;
  placeholder?: string;
  options?: FieldOption[];      // For dropdown, radio, multiselect
  validations?: ValidatorFn[];  // Standard Angular validators
  required?: boolean;
  disabled?: boolean;
  width?: '100%' | '50%' | '33%' | '25%';
  
  // Specific constraints
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  errorMessage?: string;
  precision?: number;
  currency?: string;
}
