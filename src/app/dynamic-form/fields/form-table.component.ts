import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
    if (changes['field']) {
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
    const ctrlVal = this.group?.get(this.field.name)?.value;
    if (Array.isArray(ctrlVal) && ctrlVal.length > 0) {
      // Restore saved rows from the reactive control value
      this.rows = ctrlVal.map(r => ({ ...r }));
    } else if (this.rows.length > 0) {
      // Control was reset (e.g. createForm() rebuilt the group) but rows
      // are already in memory — push them back into the control so the
      // validator sees them and doesn't incorrectly report invalid.
      this.syncControlValue();
    } else {
      // Genuinely empty — ensure control value is [] but keep form pristine.
      this.rows = [];
      const ctrl = this.group?.get(this.field.name);
      if (ctrl) {
        ctrl.setValue([], { emitEvent: false });
      }
    }
  }

  createEmptyRow(): any {
    const row: any = {};
    if (this.field.columns) {
      for (const col of this.field.columns) {
        row[col.name] = col.defaultValue !== undefined ? col.defaultValue : (col.type === 'checkbox' ? false : '');
      }
    }
    return row;
  }

  addRow() {
    this.rows.push(this.createEmptyRow());
    this.syncControlValue(true);
  }

  removeRow(index: number) {
    if (index >= 0 && index < this.rows.length) {
      this.rows.splice(index, 1);
      this.syncControlValue(true);
    }
  }

  clearRows() {
    this.rows = [];
    this.syncControlValue(true);
  }

  onCellChange() {
    this.syncControlValue();
  }

  syncControlValue(touch = false) {
    if (!this.group || !this.field) return;
    const ctrl = this.group.get(this.field.name);
    if (ctrl) {
      // Spread into a new array so Angular's form engine always detects
      // a reference change and reliably re-runs the validator.
      ctrl.setValue([...this.rows], { emitEvent: true });
      ctrl.markAsDirty();
      if (touch) ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
    }
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
