import { ValidatorFn } from '@angular/forms';

export type FieldType = 
  'text' | 'textarea' | 'email' | 'password' | 
  'number' | 'decimal' | 'currency' | 'mobile' |
  'date' | 'timestamp' | 
  'checkbox' | 'toggle' | 'radio' | 
  'dropdown' | 'multiselect' | 'heading' | 'file';

export interface FieldOption {
  label: string;
  value: any;
}

export interface FieldConfig {
  fieldId?:string;
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
  headingTextAlignment?: 'left' | 'center' | 'right';
  
  // Specific constraints
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  errorMessage?: string;
  precision?: number;
  currency?: string;
  isEditing?: boolean;
  isAiAdded?: boolean;
  isAiModified?: boolean;
}

// versioning and Diffing Types 
export interface FormVersionSummary {
  version : number;
  displayName : string;
  changelog?:string;
  createdAt:string;
  publishedBy: string;
  summary?: { totalFields: number };
}
export type DiffChangeType = 'added' | 'removed' | 'modified' | 'reordered' | 'unchanged';

export interface PropertyDiff {
  property: string;
  oldValue: any;
  newValue: any;
}

export interface FieldDiffItem {
  fieldId: string;
  changeType: DiffChangeType;
  oldField?: FieldConfig;
  newField?: FieldConfig;
  oldIndex?: number;
  newIndex?: number;
  propertyChanges?: PropertyDiff[];
}

export interface FormDiffResult {
  versionA: string | number;
  versionB: string | number;
  items: FieldDiffItem[];
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount: number;
}