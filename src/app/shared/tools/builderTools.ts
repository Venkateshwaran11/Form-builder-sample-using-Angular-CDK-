import { Injectable, signal } from "@angular/core";
import { BuilderTool } from "../models/builder-tool.model";

@Injectable({
  providedIn: "root",
})
export class BuilderTools {
  constructor() {}
   availableTools = signal<BuilderTool[]>([
    { type: 'text', label: 'Text Input', icon: "edit", class: "btn-icon edit-btn" },
    { type: 'textarea', label: 'Text Area', icon: 'description' },
    { type: 'email', label: 'Email', icon: 'email' },
    { type: 'password', label: 'Password', icon: 'lock' },
    { type: 'number', label: 'Number', icon: 'pin' },
    { type: 'decimal', label: 'Decimal', icon: 'calculate' },
    { type: 'currency', label: 'Currency', icon: 'currency_rupee' },
    { type: 'date', label: 'Date Picker', icon: 'calendar_today' },
    { type: 'timestamp', label: 'Date & Time (Timestamp)', icon: 'schedule' },
    { type: 'dropdown', label: 'Dropdown Select', icon: 'arrow_drop_down' },
    { type: 'multiselect', label: 'Multi-Select', icon: 'check_box_outline_blank' },
    { type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
    { type: 'radio', label: 'Radio Buttons', icon: 'radio_button_checked' },
    { type: 'toggle', label: 'Boolean', icon: 'toggle_on' },
    { type: 'heading', label: 'Heading', icon: 'view_headline' },
    { type: 'file', label: 'File Upload', icon: 'file_upload' }
  ]).asReadonly();
}