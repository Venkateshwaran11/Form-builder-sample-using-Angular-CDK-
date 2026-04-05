import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { FieldConfig } from './dynamic-form/models/field-config.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { inject, NgZone } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { ConfirmDialogComponent } from './shared/dialogs/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from './shared/dialogs/alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, DragDropModule, MatIconModule, FormsModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  implements OnInit{
  constructor(private snackBar: MatSnackBar, private ngZone: NgZone, private dialog: MatDialog) {}

  /** Open a non-blocking alert modal */
  private openAlert(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    this.dialog.open(AlertDialogComponent, {
      data: { title, message, type },
      width: '420px',
      disableClose: false,
      panelClass: 'mat-dialog-clean'
    });
  }

  /** Open a confirm modal and return true/false */
  private async openConfirm(
    title: string,
    message: string,
    type: 'warning' | 'danger' | 'info' = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title, message, type, confirmText, cancelText },
      width: '440px',
      disableClose: true,
      panelClass: 'mat-dialog-clean'
    });
    return (await firstValueFrom(ref.afterClosed())) === true;
  }
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  ngOnInit(): void {
    this.loadSavedForms();
    this.formConfig = [];
    this.initFlowise();
  }

  private lastProcessedMessage: string = '';
  private lastSeenMessageCount: number = 0;

  initFlowise() {
    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
      import Chatbot from 'https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js';
      Chatbot.init({
        chatflowid: "9872ddd1-b50a-4abe-b856-b72e4ee98c72",
        apiHost: "https://cloud.flowiseai.com",
        theme: {
          button: { backgroundColor: "#3b82f6", right: 20, bottom: 20, size: "large", iconColor: "white" },
          chatWindow: {
            welcomeMessage: "Hello! I'm your Agentic AI Assistant. I can help you build forms. Try saying: 'Add a text field for Full Name'",
            backgroundColor: "#ffffff",
            fontSize: 16
          }
        },
        observersConfig: {
          observeMessages: (messages) => {
            // Send the full count + last message so we can detect new messages
            window.dispatchEvent(new CustomEvent('ai-messages-update', {
              detail: { count: messages.length, messages: messages }
            }));
          }
        }
      });
    `;
    document.body.appendChild(script);

    // Snapshot the count at app load — everything before this is history
    const historicalCount = parseInt(sessionStorage.getItem('ai_msg_count') || '0', 10);
    this.lastSeenMessageCount = historicalCount;

    let hasNewUserMessageThisSession = false;

    window.addEventListener('ai-messages-update', (event: any) => {
      this.ngZone.run(() => {
        const { count, messages } = event.detail;

        // Auto-reset if Flowise restarted with fewer messages than we remember
        if (count < historicalCount) {
          sessionStorage.removeItem('ai_msg_count');
          hasNewUserMessageThisSession = false;
          return;
        }

        // Always persist latest count
        if (count > this.lastSeenMessageCount) {
          this.lastSeenMessageCount = count;
          sessionStorage.setItem('ai_msg_count', count.toString());
        }

        // All messages after app load = "session messages"
        const sessionMessages = messages.slice(historicalCount);

        // Check for any new user message in this session
        if (sessionMessages.some((m: any) => m.type === 'userMessage')) {
          hasNewUserMessageThisSession = true;
        }

        // Don't process anything until user has actually typed
        if (!hasNewUserMessageThisSession) return;

        // Always process the LATEST apiMessage (handles streaming updates)
        const lastApiMsg = [...sessionMessages].reverse().find((m: any) => m.type === 'apiMessage');
        if (lastApiMsg) {
          const rawText = lastApiMsg.message || lastApiMsg.text || lastApiMsg.content || '';
          if (rawText.trim() && rawText !== this.lastProcessedMessage) {
            this.lastProcessedMessage = rawText;
            this.parseAICommand(rawText);
          }
        }
      });
    });
  }


  parseAICommand(message: string) {
    console.log("AI Message Received:", message);
    
    // 1. Try to see if the message contains a JSON array (Advanced Bulk Generation)
    const jsonMatch = message.match(/\[\s*\{.*\}\s*\]/s);
    if (jsonMatch) {
      try {
        const fields = JSON.parse(jsonMatch[0]);
        if (Array.isArray(fields)) {
          console.log("JSON Array detected! Bulk adding fields...");

          // Try to extract a form title from the text BEFORE the JSON block
          const textBefore = message.substring(0, message.indexOf(jsonMatch[0])).trim();
          // Look for lines like "Form Title: ..." or "Here is a ... form for ..." or just take the last sentence
          const titleMatch = textBefore.match(/(?:form[:\s]+|for\s+(?:a|an)\s+|titled?\s*[:\-]?\s*)[""']?([A-Za-z0-9 &\-\/]+)[""']?/i)
            || textBefore.match(/^(?:Here(?:'s| is)(?: a| an)?|Creating(?: a| an)?|Generating(?: a| an)?) ([^\n.!?]+)/im);

          if (titleMatch) {
            const extractedTitle = titleMatch[titleMatch.length - 1].trim();
            if (extractedTitle.length > 3) {
              this.formDisplayName = extractedTitle;
              this.formName = extractedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
            }
          }

          fields.forEach(field => {
            if (field.type && (field.label || field.name)) {
              this.addAIField(field.type, field.label || field.name, field);
            }
          });
          this.isDirty = true;
          this.snackBar.open(`AI successfully generated ${fields.length} fields!`, 'Brilliant', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['snackbar-ai']
          });
          return;
        }
      } catch (e) {
        console.error("Failed to parse AI JSON:", e);
      }
    }

    // 2. Fallback to simple command pattern: ADD_FIELD: type: [type], label: [label]
    const regex = /ADD_FIELD:\s*type[:\s]+(\w+)[,\s]+label[:\s]+([^\\n.|!]+)/i;
    const match = message.match(regex);

    if (match) {
      console.log("Match Found!", match);
      const type = match[1].toLowerCase().trim();
      const label = match[2].trim();
      this.addAIField(type, label);
    } else {
      console.log("No valid command found in AI message.");
    }
  }


  addAIField(type: string, label: string, fullConfig?: any) {
    // Validate type against available tools
    const validTool = this.availableTools.find(t => t.type === type);
    if (!validTool) {
      console.warn(`AI tried to add unknown field type: ${type}`);
      return;
    }

    const fieldName = fullConfig?.name || (label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substring(7));
    
    // Build the new field config, favoring the AI's provided JSON if available
    const newField: FieldConfig = {
      type: type as any,
      name: fieldName,
      label: label,
      placeholder: fullConfig?.placeholder || `Enter ${label}...`,
      required: fullConfig?.required || false,
      width: fullConfig?.width || '100%',
      options: fullConfig?.options || ((type === 'dropdown' || type === 'radio' || type === 'multiselect')
        ? [{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }]
        : undefined),
      precision: fullConfig?.precision,
      currency: fullConfig?.currency
    };

    this.formConfig = [...this.formConfig, newField];
    this.isDirty = true;
    
    if (!fullConfig) {
      this.snackBar.open(`AI added a new ${type} field: "${label}"`, 'Awesome!', {
        duration: 4000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['snackbar-ai']
      });
    }
  }

  mode: 'edit' | 'view' = 'edit';

  toggleMode() {
    this.mode = this.mode === 'edit' ? 'view' : 'edit';
    if (this.mode === 'edit') this.submittedData = null;
  }

  isDirty: boolean = false;
  searchQuery: string = '';
  showSearchPopover: boolean = false;
  savedForms: any[] = [];

  get filteredForms() {
    if (!this.searchQuery) {
      return this.savedForms.slice(0, 5); // Show top 5 recent forms
    }
    const query = this.searchQuery.toLowerCase();
    return this.savedForms.filter(f => 
      f.displayName.toLowerCase().includes(query) || 
      f.name.toLowerCase().includes(query)
    );
  }

  loadSavedForms() {
    this.http.get<any[]>(`${this.apiUrl}/forms`).subscribe({
      next: (forms) => {
        this.savedForms = forms
      },
      error: (err) => console.error('Error loading forms:', err)
    });
  }

  exportConfig() {
    const configJson = JSON.stringify(this.formConfig, null, 2);
    console.log('Exported Form Configuration:', configJson);
    this.openAlert('Exported!', 'Form configuration has been exported to the browser console.', 'success');
  }

  async clearConfig() {
    const ok = await this.openConfirm(
      'Clear Form',
      'Are you sure you want to clear the entire form? This action cannot be undone.',
      'danger', 'Yes, Clear', 'Cancel'
    );
    if (ok) {
      this.isDirty = false;
      this.createNewForm(true)
    }
  }

  async createNewForm(afterSave: boolean = false) {
    if (this.isDirty) {
      const ok = await this.openConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to start a new form?',
        'warning', 'Yes, Start New', 'Cancel'
      );
      if (!ok) return;
    }
    this.formConfig = [];
    this.formName = 'untitled_form';
    this.formDisplayName = 'Untitled Form';
    this.isDirty = false;
    this.submittedData = null;
    this.id = '';
    if(!afterSave){
    this.openAlert('New Form Ready', 'A fresh new form has been started!', 'success');
    }
  }
  id='';
  saveConfig() {
    const formData = {
      name: this.formName,
      displayName: this.formDisplayName,
      config: this.formConfig,
      _id:this.id
    };

    this.http.post(`${this.apiUrl}/forms`, formData).subscribe({
      next: () => {
        this.isDirty = false;
        this.loadSavedForms();
        this.snackBar.open(`"${this.formDisplayName}" saved successfully!`, 'OK', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        this.createNewForm(true)

      },
      error: (err) => {
        console.error('Error saving form:', err);
        this.snackBar.open(`Failed to save "${this.formDisplayName}" ${err.error.error}`, 'Dismiss', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  async loadForm(form: any) {
    if (this.isDirty) {
      const ok = await this.openConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to load another form?',
        'warning', 'Yes, Load Form', 'Cancel'
      );
      if (!ok) return;
    }
    this.formConfig = [...form.config];
    this.formName = form.name;
    this.formDisplayName = form.displayName;
    this.isDirty = false;
    this.showSearchPopover = false;
    this.searchQuery = '';
    this.id=form._id;
  }

  async deleteForm(event: Event, formName: string) {
    event.stopPropagation();
    const ok = await this.openConfirm(
      'Delete Form',
      `Are you sure you want to delete form "${formName}"? This cannot be undone.`,
      'danger', 'Yes, Delete', 'Cancel'
    );
    if (ok) {
      this.http.delete(`${this.apiUrl}/forms/${formName}`).subscribe({
        next: () => {
          this.loadSavedForms();
          this.openAlert('Deleted', `Form "${formName}" has been deleted.`, 'success');
        },
        error: (err) => console.error('Error deleting form:', err)
      });
    }
  }
  tabs = [
  { id: 'tab1', label: 'Fields' },
  { id: 'tab2', label: 'Actions' },
  // { id: 'tab3', label: 'Review' }
];

activeTab = this.tabs[0].id;
  availableTools = [
    { type: 'text', label: 'Text Input', icon: "edit",class:"btn-icon edit-btn" },
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
    { type: 'toggle', label: 'Boolean', icon: 'toggle_on' }
  ];

  formConfig: FieldConfig[] = []; // Starts functionally empty
  submittedData: any = null;
  formName: string = 'untitled_form';
  formDisplayName: string = 'Untitled Form';

  onFormSubmit(value: any) {
    const finalData = { 
      formId: this.formName, 
      data: value 
    };

    console.log('Persisting Form Submission ->', finalData);
    
    this.http.post(`${this.apiUrl}/responses`, finalData).subscribe({
      next: (res) => {
        console.log('Submission successful:', res);
        this.submittedData = value;
        this.openAlert('Submitted!', 'Your form response has been saved to the database.', 'success');
      },
      error: (err) => {
        console.error('Submission error:', err);
        this.openAlert('Submission Failed', 'Could not submit the form to the backend. Please try again.', 'error');
      }
    });
  }

  onConfigChange(newConfig: FieldConfig[]) {
    this.formConfig = newConfig;
    this.isDirty = true;
    console.log('Form Config Structure Updated ->', this.formConfig);
  }
}