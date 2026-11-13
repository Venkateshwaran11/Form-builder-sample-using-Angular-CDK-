import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FieldConfig, TableColumnConfig, TableColumnType } from '../models/field-config.interface';

@Component({
  selector: 'app-form-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './form-table.component.html',
  styleUrl: './form-table.component.css'
})
export class FormTableComponent implements OnInit, OnChanges {
  @Input() field!: FieldConfig;
  @Input() group!: FormGroup;
  @Input() mode: 'edit' | 'view' = 'edit';
  @Output() columnsChange = new EventEmitter<TableColumnConfig[]>();

  rows: any[] = [];
  editingColumnIndex: number | null = null;
  editingColumn: TableColumnConfig | null = null;
  isAddingColumn = false;

  newColumn: TableColumnConfig = {
    id: '',
    name: '',
    label: '',
    type: 'text',
    placeholder: '',
    required: false
  };

  availableColumnTypes: { type: TableColumnType; label: string; icon: string }[] = [
    { type: 'text', label: 'Text', icon: 'edit' },
    { type: 'number', label: 'Number', icon: 'pin' },
    { type: 'currency', label: 'Currency', icon: 'payments' },
    { type: 'date', label: 'Date', icon: 'calendar_today' },
    { type: 'dropdown', label: 'Dropdown', icon: 'arrow_drop_down' },
    { type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
    { type: 'email', label: 'Email', icon: 'email' },
    { type: 'textarea', label: 'Text Area', icon: 'description' }
  ];

  ngOnInit() {
    this.ensureDefaultColumns();
    this.initRows();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['field'] || changes['group']) {
      this.ensureDefaultColumns();
      this.initRows();
    }
  }

  ensureDefaultColumns() {
    if (!this.field.columns || this.field.columns.length === 0) {
      this.field.columns = [
        { id: 'col_1', name: 'item', label: 'Item / Description', type: 'text', placeholder: 'Enter item name...' },
        { id: 'col_2', name: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
        { id: 'col_3', name: 'price', label: 'Price', type: 'currency', currency: 'USD', placeholder: '0.00' }
      ];
    }
  }

  initRows() {
    const control = this.group?.get(this.field.name);
    if (control instanceof FormArray && control.length === this.rows.length && this.rows.length > 0) {
      return;
    }
    const ctrlVal = control instanceof FormArray ? control.getRawValue() : control?.value;
    if (Array.isArray(ctrlVal) && ctrlVal.length > 0) {
      this.rows = ctrlVal.map((r, i) => ({
        _rowId: r?._rowId || `row_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        ...r
      }));
    } else if (!this.rows.length) {
      this.rows = [];
    }
    this.rebuildFormArray(this.rows);
  }

  createEmptyRow(): any {
    const row: any = {
      _rowId: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };
    if (this.field.columns) {
      for (const col of this.field.columns) {
        row[col.name] = col.defaultValue !== undefined ? col.defaultValue : (col.type === 'checkbox' ? false : '');
      }
    }
    return row;
  }

  addRow() {
    const newRow = this.createEmptyRow();
    this.rows.push(newRow);
    const formArray = this.getTableFormArray();
    if (formArray) {
      formArray.push(this.createRowGroup(newRow));
      formArray.markAsDirty();
      formArray.markAsTouched();
    } else {
      this.syncControlValue(true);
    }
  }

  removeRow(index: number) {
    if (index >= 0 && index < this.rows.length) {
      this.rows.splice(index, 1);
      const formArray = this.getTableFormArray();
      if (formArray && formArray.length > index) {
        formArray.removeAt(index);
        formArray.markAsDirty();
        formArray.markAsTouched();
      } else {
        this.syncControlValue(true);
      }
    }
  }

  clearRows() {
    this.rows = [];
    const formArray = this.getTableFormArray();
    if (formArray) {
      formArray.clear();
      formArray.markAsDirty();
      formArray.markAsTouched();
    } else {
      this.syncControlValue(true);
    }
  }

  onCellChange(rowIndex?: number, colName?: string) {
    const formArray = this.getTableFormArray();
    if (!formArray) return;
    formArray.markAsDirty();
    if (rowIndex !== undefined && colName && this.rows[rowIndex]) {
      this.rows[rowIndex][colName] = formArray.at(rowIndex)?.get(colName)?.value;
    }
  }

  syncControlValue(touch = false) {
    if (!this.group || !this.field) return;
    const formArray = this.rebuildFormArray(this.rows);
    formArray.markAsDirty();
    if (touch) formArray.markAsTouched();
  }

  getTableFormArray(): FormArray | null {
    const control = this.group?.get(this.field?.name);
    return control instanceof FormArray ? control : null;
  }

  getCellControl(rowIndex: number, columnName: string): AbstractControl | null {
    return this.getTableFormArray()?.at(rowIndex)?.get(columnName) ?? null;
  }

  isCellInvalid(rowIndex: number, columnName: string): boolean {
    const control = this.getCellControl(rowIndex, columnName);
    return !!control?.invalid && !!control.touched;
  }

  trackByRow(index: number, row: any): any {
    return row?._rowId || index;
  }

  trackByCol(index: number, col: TableColumnConfig): string {
    return col?.name || col?.id || String(index);
  }

  trackByOpt(index: number, opt: any): any {
    return opt?.value ?? index;
  }

  private createRowGroup(row: Record<string, any>): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const column of this.field.columns || []) {
      const validators = [];
      if (column.required) {
        validators.push(column.type === 'checkbox' ? Validators.requiredTrue : Validators.required);
      }
      if (column.type === 'email') {
        validators.push(Validators.email);
      }
      const value = row[column.name] !== undefined
        ? row[column.name]
        : column.defaultValue !== undefined
          ? column.defaultValue
          : column.type === 'checkbox' ? false : '';
      controls[column.name] = new FormControl(value, validators);
    }
    return new FormGroup(controls);
  }

  private rebuildFormArray(rows: Record<string, any>[]): FormArray {
    const existing = this.group.get(this.field.name);
    const formArray = new FormArray(
      rows.map(row => this.createRowGroup(row)),
      existing?.validator ?? null,
      existing?.asyncValidator ?? null
    );
    if (existing?.disabled) {
      formArray.disable({ emitEvent: false });
    }
    if (existing?.dirty) {
      formArray.markAsDirty({ onlySelf: true });
    }
    if (existing?.touched) {
      formArray.markAsTouched({ onlySelf: true });
    }
    this.group.setControl(this.field.name, formArray, { emitEvent: false });
    return formArray;
  }

  // --- Column Management Methods (for Form Builder mode) ---

  openAddColumnModal() {
    const nextColNum = (this.field.columns?.length || 0) + 1;
    this.newColumn = {
      id: `col_${Date.now()}`,
      name: `column_${nextColNum}`,
      label: `Column ${nextColNum}`,
      type: 'text',
      placeholder: '',
      required: false,
      currency: 'USD',
      options: [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' }
      ]
    };
    this.isAddingColumn = true;
    this.editingColumnIndex = null;
  }

  onNewColumnLabelChange(newLabel: string) {
    this.newColumn.label = newLabel;
    const autoKey = (newLabel || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
    this.newColumn.name = autoKey || `col_${Date.now()}`;
  }

  saveNewColumn() {
    if (!this.newColumn.label?.trim()) {
      this.newColumn.label = `Column ${(this.field.columns?.length || 0) + 1}`;
    }
    if (!this.newColumn.name?.trim()) {
      this.newColumn.name = `col_${Date.now()}`;
    }
    if (!this.field.columns) {
      this.field.columns = [];
    }

    // Ensure unique name
    let colName = this.newColumn.name;
    let count = 1;
    while (this.field.columns.some(c => c.name === colName)) {
      colName = `${this.newColumn.name}_${count++}`;
    }
    this.newColumn.name = colName;

    this.field.columns.push({ ...this.newColumn });
    this.isAddingColumn = false;
    this.columnsChange.emit(this.field.columns);

    // Sync default value for existing rows
    for (const r of this.rows) {
      if (r[colName] === undefined) {
        r[colName] = this.newColumn.defaultValue !== undefined ? this.newColumn.defaultValue : '';
      }
    }
    this.syncControlValue();
  }

  cancelAddColumn() {
    this.isAddingColumn = false;
  }

  openEditColumnModal(index: number) {
    if (!this.field.columns || index < 0 || index >= this.field.columns.length) return;
    this.editingColumnIndex = index;
    this.editingColumn = JSON.parse(JSON.stringify(this.field.columns[index]));
    if (this.editingColumn && !this.editingColumn.options) {
      this.editingColumn.options = [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' }
      ];
    }
    this.isAddingColumn = false;
  }

  saveEditColumn() {
    if (this.editingColumnIndex === null || !this.editingColumn || !this.field.columns) return;
    const oldName = this.field.columns[this.editingColumnIndex].name;
    const newName = this.editingColumn.name || oldName;

    this.field.columns[this.editingColumnIndex] = { ...this.editingColumn };

    // Update row keys if column name was renamed
    if (oldName !== newName) {
      for (const r of this.rows) {
        if (r[oldName] !== undefined) {
          r[newName] = r[oldName];
          delete r[oldName];
        }
      }
    }

    this.editingColumnIndex = null;
    this.editingColumn = null;
    this.columnsChange.emit(this.field.columns);
    this.syncControlValue();
  }

  cancelEditColumn() {
    this.editingColumnIndex = null;
    this.editingColumn = null;
  }

  deleteColumn(index: number, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.field.columns || this.field.columns.length <= 1) {
      return; // Keep at least one column
    }
    const removedCol = this.field.columns[index];
    this.field.columns.splice(index, 1);

    // Clean up rows
    if (removedCol) {
      for (const r of this.rows) {
        delete r[removedCol.name];
      }
    }

    if (this.editingColumnIndex === index) {
      this.editingColumnIndex = null;
      this.editingColumn = null;
    } else if (this.editingColumnIndex !== null && this.editingColumnIndex > index) {
      this.editingColumnIndex--;
    }

    this.columnsChange.emit(this.field.columns);
    this.syncControlValue();
  }

  addOptionToEditingColumn(col: TableColumnConfig) {
    if (!col.options) col.options = [];
    const count = col.options.length + 1;
    col.options.push({ label: `Option ${count}`, value: `opt_${count}` });
  }

  removeOptionFromEditingColumn(col: TableColumnConfig, optIndex: number) {
    if (col.options) {
      col.options.splice(optIndex, 1);
    }
  }

  getColumnTypeLabel(type: TableColumnType): string {
    const item = this.availableColumnTypes.find(t => t.type === type);
    return item ? item.label : type;
  }

  getColumnTypeIcon(type: TableColumnType): string {
    const item = this.availableColumnTypes.find(t => t.type === type);
    return item ? item.icon : 'view_column';
  }

  getCurrencySymbol(currencyCode?: string): string {
    const symbolMap: Record<string, string> = {
      USD: '$', EUR: '€', INR: '₹', GBP: '£', JPY: '¥', CAD: 'CA$', AUD: 'A$', CHF: 'Fr'
    };
    return symbolMap[currencyCode || 'USD'] || currencyCode || '$';
  }
}
