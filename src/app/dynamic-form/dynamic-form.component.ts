import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FieldConfig } from './models/field-config.interface';
import { DynamicFieldComponent } from './dynamic-field/dynamic-field.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule, DynamicFieldComponent,MatIconModule],
  template: `
    <form class="dynamic-form" [class.view-form]="mode === 'view'" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-header">
        <div class="form-title-area">
          <ng-container *ngIf="mode === 'edit'; else viewHeader">
            <div class="form-title-editor">
              <input type="text" [ngModel]="formDisplayName" (ngModelChange)="updateFormDisplayName($event)" [ngModelOptions]="{standalone: true}" class="title-input" placeholder="Form Display Name" title="Edit Form Display Name">
              <div class="form-name-row">
                <label>Form ID:</label>
                <input type="text" [ngModel]="formName" (ngModelChange)="updateFormName($event)" [ngModelOptions]="{standalone: true}" class="name-input" placeholder="form_id" title="Auto-generated Form ID Key">
              </div>
            </div>
          </ng-container>
          
          <ng-template #viewHeader>
            <h3 class="view-title">{{ formDisplayName }}</h3>
            <p class="form-id-display">ID: {{ formName }}</p>
          </ng-template>
        </div>

        <div class="header-actions">
          <button type="button" class="action-btn preview-btn" (click)="toggleModeRequest()">
            <mat-icon>{{ mode === 'edit' ? 'visibility' : 'edit' }}</mat-icon>
            <span>{{ mode === 'edit' ? 'Preview' : 'Editor' }}</span>
          </button>
          
          <button type="button" class="action-btn generate-btn" *ngIf="mode === 'edit'" (click)="generateInternalJson()">
            <mat-icon>description</mat-icon>
            <span>Export JSON</span>
          </button>

          <button type="submit" [disabled]="form.invalid" class="action-btn save-btn" *ngIf="mode === 'view'">
            <mat-icon>save</mat-icon>
            <span>Save</span>
          </button>
        </div>
      </div>

      <div cdkDropList class="field-list" [class.view-list]="mode === 'view'" [cdkDropListDisabled]="mode === 'view'" [cdkDropListData]="config" (cdkDropListDropped)="drop($event)">
        
        <!-- Empty State Placeholder -->
        <div class="canvas-empty-state" *ngIf="config.length === 0 && mode === 'edit'">
          <div class="empty-icon-wrapper">
            <mat-icon class="empty-icon">add_task</mat-icon>
          </div>
          <h4 class="empty-title">Your canvas is empty</h4>
          <p class="empty-subtitle">Drag and drop fields from the left sidebar to start building your dynamic form.</p>
          <div class="empty-hint">
             <mat-icon style="font-size: 16px; width: 16px; height: 16px; vertical-align: middle;">tips_and_updates</mat-icon>
             <span>Hint: You can reorder fields by dragging them.</span>
          </div>
        </div>

        <div class="field-box" [class.view-box]="mode === 'view'" *ngFor="let field of config; let i = index" cdkDrag [cdkDragDisabled]="mode === 'view'" [style.flex]="(editingIndex === i && mode === 'edit') ? '0 0 100%' : '0 0 ' + getFlexWidth(field.width)">
          <div class="drag-handle" *ngIf="mode === 'edit'" cdkDragHandle>
            <span class="handle-icon">⠿</span>
            <span class="field-name">
              <span class="name-text" [title]="field.label">{{ field.label }}</span>
              <small class="key-display" [title]="field.name">(Key: {{field.name}})</small>
            </span>
            <button type="button" class="btn-icon edit-btn" (click)="toggleEdit(i)" title="Edit Properties"><mat-icon>edit </mat-icon></button>
            <button type="button" class="btn-icon remove-btn" (click)="removeField(i)" title="Remove Field"><mat-icon>delete</mat-icon></button>
          </div>
          
          <!-- Inline Property Editor -->
          <div class="property-editor"  *ngIf="editingIndex === i && mode === 'edit'">
            <h4 style="margin-top:0; font-size:1rem; color:#1e293b;">Field Properties</h4>
            
            <div class="editor-row">
              <label>Field Label:</label>
              <input type="text" [ngModel]="field.label" (ngModelChange)="updateLabel(i, $event)" [ngModelOptions]="{standalone: true}" class="editor-input">
            </div>
            
            <div class="editor-row">
              <label>JSON Key (Name):</label>
              <input type="text" [ngModel]="field.name" (ngModelChange)="updateFieldName(i, $event)" [ngModelOptions]="{standalone: true}" class="editor-input">
            </div>
            
            <div class="editor-row">
              <label>Field Width:</label>
              <select [(ngModel)]="field.width" (ngModelChange)="configChange.emit(config)" [ngModelOptions]="{standalone: true}" class="editor-input">
                <option value="100%">100% (Full Row)</option>
                <option value="50%">50% (Half Row)</option>
                <option value="33%">33% (One Third)</option>
                <option value="25%">25% (One Quarter)</option>
              </select>
            </div>
            
            <div class="editor-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="field.required" (ngModelChange)="updateRequired(i, $event)" [ngModelOptions]="{standalone: true}">
                Required Field
              </label>
            </div>

            <div class="editor-row options-editor" *ngIf="field.type === 'dropdown' || field.type === 'multiselect' || field.type === 'radio'">
              <label>Options:</label>
              <div class="options-list">
                <div *ngFor="let opt of field.options; let j = index" class="option-row">
                  <input type="text" [(ngModel)]="opt.label" [ngModelOptions]="{standalone: true}" placeholder="Display Label">
                  <input type="text" [(ngModel)]="opt.value" [ngModelOptions]="{standalone: true}" placeholder="JSON Value">
                  <button type="button" class="btn-icon remove-btn sm" (click)="removeOption(field, j)" title="Remove Option">&times;</button>
                </div>
                <button type="button" class="add-btn sm" (click)="addOption(field)">+ Add Option</button>
              </div>
            </div>
             <div class="editor-row options-editor" *ngIf="field.type === 'number'">
              <label>Min / Max:</label>
              <div class="options-list">
                <div class="option-row">
                  <input type="number" [(ngModel)]="field.min" [ngModelOptions]="{standalone: true}" placeholder="Min Value">
                  <input type="number" [(ngModel)]="field.max" [ngModelOptions]="{standalone: true}" placeholder="Max Value">
                </div>  
              </div>
            </div>
            <div class="editor-row options-editor" *ngIf="field.type === 'decimal' || field.type === 'currency'">
              <label>Decimal Precision:</label>
              <div class="options-list">
                <div class="option-row">
                  <input type="number" [(ngModel)]="field.precision" [ngModelOptions]="{standalone: true}" placeholder="Precision">
                </div>  
              </div>
            </div>
            <div class="editor-row options-editor" *ngIf="field.type === 'currency'">
              <label>Choose a Currency:</label>
              <div class="options-list">
                <div class="option-row">
                  <select [(ngModel)]="field.currency" [ngModelOptions]="{standalone: true}" class="editor-input">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>  
              </div>
            </div>

            <div class="editor-actions" [class.blur]="field.label === '' || field.name === ''">
              <button type="button" class="save-btn" (click)="toggleEdit(null)">Done Editing</button>
            </div>
          </div>

          <!-- Actual Rendered Field from Engine -->
          <div class="field-content" [class.blur]="editingIndex === i && mode === 'edit'">
            <app-dynamic-field [field]="field" [group]="form"></app-dynamic-field>
          </div>
        </div>

      </div>

      <div class="submission-result" *ngIf="(jsonString | keyvalue).length > 0">
        <h3>✅ Form Successfully Submitted!</h3>
        <p style="margin-bottom: 15px; color: #94a3b8; font-size: 0.9rem; margin-top:0;">Here is the resulting JSON payload extracted natively from your dynamically generated form.</p>
        <pre>{{ jsonString | json }}</pre>
        <button class="toggle-btn" style="background:#ef4444; margin-top: 15px;" (click)="jsonString = {}">Clear Results</button>
      </div>
    </form>
  `,
  styles: [`
  /* Form Submission Results Box */
.submission-result { margin-top: 30px; background: #0f172a; color: #e2e8f0; padding: 25px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3); border: 1px solid #334155; }
.submission-result h3 { margin-top: 0; color: #10b981; border-bottom: 1px solid #334155; padding-bottom: 15px; font-size: 1.3rem; }
.submission-result pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', Courier, monospace; font-size: 0.95rem; background: #1e293b; padding: 15px; border-radius: 6px; border: 1px inset #334155; }

    :host { display: block; width: 100%; min-width: 0; }
    .dynamic-form { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box; }
    .form-header { margin-bottom: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; }
    .form-title-area { flex: 1; }
    .header-actions { display: flex; gap: 10px; flex-shrink: 0; }
    
    .action-btn { 
      padding: 8px 16px; 
      border-radius: 8px; 
      font-weight: 600; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      gap: 8px; 
      transition: all 0.2s; 
      border: 1px solid transparent; 
      font-size: 0.9rem;
    }
    .action-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    
    .preview-btn { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
    .preview-btn:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
    
    .generate-btn { background: #3b82f6; color: white; }
    .generate-btn:hover { background: #2563eb; transform: translateY(-1px); }
    
    .save-btn { background: #10b981; color: white; }
    .save-btn:hover { background: #059669; transform: translateY(-1px); }
    .save-btn:disabled { background: #94a3b8; cursor: not-allowed; transform: none; }
    .form-title-editor { display: flex; flex-direction: column; gap: 4px; margin-bottom: 5px; }
    .title-input { font-size: 1.6rem; font-weight: 700; color: #0f172a; border: 1px solid transparent; border-bottom: 2px solid #cbd5e1; padding: 5px 0; background: transparent; transition: border-color 0.2s; outline: none; width: 100%; font-family: inherit; }
    .title-input:focus { border-bottom-color: #3b82f6; }
    .form-name-row { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #64748b; }
    .name-input { border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; font-size: 0.85rem; color: #475569; font-family: monospace; max-width: 300px; outline: none; background: #f8fafc; }
    .name-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
    .view-title { margin: 0; color: #0f172a; font-size: 1.6rem; font-weight: 700; }
    .form-id-display { font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin: 4px 0 0 0; }
    
    /* Empty State Styles */
    .canvas-empty-state {
      width: 100%;
      height: 100%;
      min-height: 250px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
      background: rgba(248, 250, 252, 0.5);
      border-radius: 12px;
      border: 2px dashed #cbd5e1;
      margin: auto;
      pointer-events: none;
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .empty-icon-wrapper { background: #f1f5f9; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; color: #94a3b8; }
    .empty-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty-title { margin: 0 0 8px 0; color: #334155; font-size: 1.25rem; font-weight: 700; }
    .empty-subtitle { margin: 0 0 20px 0; color: #64748b; font-size: 0.95rem; max-width: 300px; line-height: 1.5; }
    .empty-hint { background: #eff6ff; color: #3b82f6; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    
    .field-list { min-height: 200px; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 15px; background: #f8fafc; transition: background 0.2s; display: flex !important; flex-wrap: wrap; gap: 15px; align-items: flex-start; align-content: flex-start; }
    .cdk-drop-list-dragging { background: #e0f2fe; border-color: #7dd3fc; }
    
    .field-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0 !important; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: flex 0.3s ease, box-shadow 0.2s; box-sizing: border-box; }
    .field-box:hover { box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    
    .drag-handle { background: #f1f5f9; padding: 8px 10px; display: flex; align-items: center; cursor: grab; border-bottom: 1px solid #e2e8f0; overflow: hidden; gap: 4px; }
    .drag-handle:active { cursor: grabbing; }
    .handle-icon { color: #94a3b8; font-size: 1.2rem; cursor: grab; flex-shrink: 0; }
    
    .field-name { flex: 1; font-size: 0.95rem; color: #334155; font-weight: 600; display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; }
    .name-text { overflow: hidden; text-overflow: ellipsis; }
    .key-display { color: #0ea5e9; font-family: monospace; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; flex-shrink: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    
    .btn-icon { background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0; }
    .edit-btn { color: #3b82f6; margin-right: 5px; }
    .edit-btn:hover { background: #dbeafe; }
    .remove-btn { color: #ef4444; font-size: 1.5rem; }
    .remove-btn:hover { background: #fee2e2; }
    
    .field-content { padding: 20px; transition: opacity 0.2s; }
    .blur { 
      opacity: 0.4; 
      pointer-events: none;
      cursor:not-allowed; 
    }
    
    /* Property Editor Styles */
    .property-editor { background: #fef9c3; padding: 20px; border-bottom: 1px solid #e2e8f0; }
    .editor-row { display: flex; align-items: center; margin-bottom: 15px; }
    .editor-row label { width: 140px; font-weight: 600; color: #334155; font-size: 0.9rem; }
    .editor-input { flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; }
    .editor-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
    .checkbox-label { display: flex !important; align-items: center; gap: 8px; width: auto !important; cursor: pointer; }
    
    .options-editor { align-items: flex-start; border-top: 1px dashed #cbd5e1; padding-top: 15px; margin-top: 5px; }
    .options-list { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .option-row { display: flex; gap: 8px; align-items: center; }
    .option-row input { flex: 1; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; color: #334155; }
    .sm { font-size: 1.2rem; padding: 2px 5px; display: inline-flex; height: auto; width: auto; align-items: center; }
    .add-btn { background: #e2e8f0; border: none; border-radius: 4px; color: #334155; font-weight: 600; cursor: pointer; align-self: flex-start; margin-top: 5px; transition: background 0.2s; padding: 6px 10px; font-size: 0.85rem;}
    .add-btn:hover { background: #cbd5e1; }

    .editor-actions { text-align: right; margin-top: 15px; }
    .save-btn { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .save-btn:hover { background: #059669; }
    
    /* Form Submissions */
    .form-actions { margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    .submit-btn { background: #3b82f6; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .submit-btn:hover { background: #2563eb; }
    .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }
    
    .cdk-drag-preview { box-sizing: border-box; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); background: white; border: 2px solid #3b82f6; }
    .cdk-drag-placeholder { opacity: 0; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }

    .view-form { box-shadow: none; border: none; padding: 0; background: transparent; }
    .view-list { background: transparent; border: none; padding: 0; min-height: auto; }
    .view-box { border: none; margin-bottom: 25px; box-shadow: none; background: transparent; }
    .view-box:hover { box-shadow: none; }
    .view-box .field-content { padding: 0; }
  `]
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() config: FieldConfig[] = [];
  @Input() mode: 'edit' | 'view' = 'edit';
  @Input() formName: string = '';
  @Input() formDisplayName: string = '';

  @Output() submitForm = new EventEmitter<any>();
  @Output() configChange = new EventEmitter<FieldConfig[]>();
  @Output() formNameChange = new EventEmitter<string>();
  @Output() formDisplayNameChange = new EventEmitter<string>();
  @Output() toggleMode = new EventEmitter<void>();

  form!: FormGroup;
  editingIndex: number | null = null;
  jsonString: any = {};

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    const savedConfig = localStorage.getItem('dynamicFormConfig');
  const savedFormName = localStorage.getItem('dynamicFormName');
  const savedFormDisplayName = localStorage.getItem('dynamicFormDisplayName');

  if (savedConfig) {
    this.config = JSON.parse(savedConfig);
  }

  if (savedFormName) {
    this.formName = savedFormName;
  }

  if (savedFormDisplayName) {
    this.formDisplayName = savedFormDisplayName;
  }
    this.createForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config'] && !changes['config'].isFirstChange()) {
      this.createForm();
    }
  }

  createForm() {
    const group = this.fb.group({});
    this.config.forEach(field => {
      let validators: any[] = [];
      if (field.validations) {
        validators = validators.concat(field.validations);
      }
      if (field.required) {
        validators.push(Validators.required);
      }
      if(field.min){
        validators.push(Validators.min(field.min));
      }
      if(field.max){
        validators.push(Validators.max(field.max));
      }
      group.addControl(field.name, this.fb.control(field.value || '', validators.length > 0 ? validators : null));
    });
    this.form = group;
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      // Reordering fields inside the canvas
      moveItemInArray(this.config, event.previousIndex, event.currentIndex);
    } else {
      // Incoming tool from sidebar palette
      const tool = event.previousContainer.data[event.previousIndex];

      const newFieldType = tool.type;
      const baseName = tool.label.toLowerCase().replace(/[^a-z0-9]/g, ''); //`field_${new Date().getTime()}`;

      const newField: FieldConfig = {
        type: newFieldType,
        name: baseName,
        label: `New ${tool.label}`,
        placeholder: `Enter ${tool.label}...`,
        required: false,
        width: '100%',
        options: (newFieldType === 'dropdown' || newFieldType === 'radio' || newFieldType === 'multiselect')
          ? [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' }
          ]
          : undefined
      };

      // Add to config at exactly the dropped index
      this.config.splice(event.currentIndex, 0, newField);

      // Update reactive form
      const validators = newField.required ? [Validators.required] : [];
      this.form.addControl(newField.name, this.fb.control('', validators));

      // Automatically open the editor for this new field!
      this.editingIndex = event.currentIndex;
    }
    this.configChange.emit(this.config);
  }

  toggleEdit(index: number | null) {
    this.editingIndex = index;
  }

  updateLabel(index: number, newLabel: string) {
    this.config[index].label = newLabel || '';

    // Auto-generate JSON key based on label (lowercase, no special chars, no spaces)
    const autoName = (newLabel || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    this.updateFieldName(index, autoName);
  }

  updateRequired(index: number, isRequired: boolean) {
    this.config[index].required = isRequired;

    setTimeout(() => {
      const fieldName = this.config[index].name;
      const ctrl = this.form.get(fieldName);

      if (ctrl) {
        let validators: any[] = [];
        if (this.config[index].validations) {
          validators = validators.concat(this.config[index].validations);
        }
        if (isRequired) {
          validators.push(Validators.required);
        }
        ctrl.setValidators(validators.length > 0 ? validators : null);
        ctrl.updateValueAndValidity();
      }
      this.configChange.emit(this.config);
    });
  }

  updateFieldName(index: number, newName: string) {
    if (newName === null || newName === undefined) return;

    // Clean up string to avoid invalid JSON keys
    newName = newName.replace(/[^a-zA-Z0-9_]/g, '');

    const oldName = this.config[index].name;
    if (oldName === newName) return;

    // Update config name first so the template gets new field.name
    this.config[index].name = newName;

    // Defer the FormGroup control swap to after Angular's CD cycle completes.
    // Without setTimeout, the template re-renders with the new field.name before
    // the old control is removed/new one added → "no FormControl for 'venky'" error.
    setTimeout(() => {
      const oldControl = this.form.get(oldName);
      if (oldControl) {
        this.form.addControl(newName, this.fb.control(oldControl.value, oldControl.validator));
        this.form.removeControl(oldName);
      } else if (!this.form.get(newName)) {
        // Control didn't exist yet (edge case), add a fresh one
        this.form.addControl(newName, this.fb.control(''));
      }
      this.configChange.emit(this.config);
    });
  }

  getFlexWidth(width?: string): string {
    if (!width || width === '100%') return '100%';
    if (width === '50%') return 'calc(50% - 7.5px)';
    if (width === '33%') return 'calc(33.333% - 10px)';
    if (width === '25%') return 'calc(25% - 11.25px)';
    return '100%';
  }

  removeField(index: number) {
    const fieldName = this.config[index].name;
    this.form.removeControl(fieldName);

    this.config = this.config.filter((_, i) => i !== index);
    if (this.editingIndex === index) {
      this.editingIndex = null;
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex--;
    }

    this.configChange.emit(this.config);
  }

  addOption(field: FieldConfig) {
    if (!field.options) field.options = [];
    const newIdx = field.options.length + 1;
    field.options.push({ label: `Option ${newIdx}`, value: `opt${newIdx}` });
    this.configChange.emit(this.config);
  }

  removeOption(field: FieldConfig, index: number) {
    if (field.options) {
      field.options.splice(index, 1);
      this.configChange.emit(this.config);
    }
  }

  onSubmit() {
    this.submitForm.emit(this.form.value);
  }

  updateFormDisplayName(newName: string) {
    this.formDisplayName = newName;
    this.formDisplayNameChange.emit(this.formDisplayName);

    const autoId = (newName || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    this.updateFormName(autoId || 'untitled_form');
  }

  updateFormName(newId: string) {
    newId = (newId || '').replace(/[^a-zA-Z0-9_]/g, '');
    this.formName = newId;
    this.formNameChange.emit(this.formName);
  }

  generateInternalJson() {
    const finalFormJson = {
      type: this.formName,
      formName: this.formName,
      formDisplayName: this.formDisplayName,
      fields: this.config
    };
    this.jsonString = finalFormJson;
    console.log('Generated Form Configuration JSON schema:', this.jsonString);
    // alert('Generated internal form configuration JSON successfully! Check the browser console.');
  }

  toggleModeRequest() {
    this.toggleMode.emit();
  }
}
