import { Component, OnInit, NgZone, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { DynamicFormComponent } from '../../dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../dynamic-form/models/field-config.interface';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, DragDropModule, MatIconModule, FormsModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './builder.component.html',
  styleUrl: './builder.component.css'
})
export class BuilderComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private lastProcessedMessage: string = '';
  private lastSeenMessageCount: number = 0;
  private flowiseEventTarget = window;
  private messageUpdateHandler: any;

  constructor(
    private snackBar: MatSnackBar, 
    private ngZone: NgZone, 
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.formConfig = [];
    
    // Check if we are loading an existing form
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.loadForm(id);
      } else {
        this.createNewForm(true);
      }
    });

    this.initFlowise();
  }

  ngOnDestroy(): void {
    // Remove flowise AI chatbot from DOM if we leave the builder? 
    // Actually flowise injects it globally usually, but we could try to destroy it or hide it.
    const flowiseRoot = document.getElementById('flowise-chat-bubble-root');
    if (flowiseRoot) flowiseRoot.style.display = 'none';
    
    if (this.messageUpdateHandler) {
      window.removeEventListener('ai-messages-update', this.messageUpdateHandler);
    }
  }

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

  initFlowise() {
    const existingRoot = document.getElementById('flowise-chat-bubble-root');
    if (existingRoot) {
        existingRoot.style.display = 'block'; // Ensure it's visible if already initialized
    } else {
        const script = document.createElement('script');
        script.type = 'module';
        script.innerHTML = `
        import Chatbot from 'https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js';
        Chatbot.init({
            chatflowid: "9872ddd1-b50a-4abe-b856-b72e4ee98c72",
            apiHost: "https://cloud.flowiseai.com",
            theme: {
            button: { 
                backgroundColor: "#2563eb", right: 20, bottom: 20, size: "large", iconColor: "white",
                customIconSrc: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxwYXRoIGQ9Ik0xOSAzbC0xLjUgMy41TDE0IDhsMy41IDEuNUwxOSAxM2wxLjUtMy41TDI0IDhsLTMuNS0xLjVMMTkgM3ptLTcgMi41TDkgMSA2LjUgNS41IDEgOGw1LjUgMi41TDkgMTVsMi41LTQuNUwxNyA4bC01LjUtMi41ek0xOSAxNWwtMS4yIDIuOEwxNSAxOWwyLjggMS4yTDE5IDIzbDEuMi0yLjhMMjMgMTlsLTIuOC0xLjJMMTkgMTV6Ii8+PC9zdmc+"
            },
            chatWindow: { welcomeMessage: "Hello! I'm your Agentic AI Assistant.", backgroundColor: "#ffffff", fontSize: 16 }
            },
            observersConfig: {
            observeMessages: (messages) => {
                window.dispatchEvent(new CustomEvent('ai-messages-update', { detail: { count: messages.length, messages: messages } }));
            }
            }
        });
        `;
        document.body.appendChild(script);
    }

    const historicalCount = parseInt(sessionStorage.getItem('ai_msg_count') || '0', 10);
    this.lastSeenMessageCount = historicalCount;
    let hasNewUserMessageThisSession = false;

    this.messageUpdateHandler = (event: any) => {
      this.ngZone.run(() => {
        const { count, messages } = event.detail;
        if (count < historicalCount) {
          sessionStorage.removeItem('ai_msg_count');
          hasNewUserMessageThisSession = false;
          return;
        }
        if (count > this.lastSeenMessageCount) {
          this.lastSeenMessageCount = count;
          sessionStorage.setItem('ai_msg_count', count.toString());
        }
        const sessionMessages = messages.slice(historicalCount);
        if (sessionMessages.some((m: any) => m.type === 'userMessage')) {
          hasNewUserMessageThisSession = true;
        }
        if (!hasNewUserMessageThisSession) return;
        const lastApiMsg = [...sessionMessages].reverse().find((m: any) => m.type === 'apiMessage');
        if (lastApiMsg) {
          const rawText = lastApiMsg.message || lastApiMsg.text || lastApiMsg.content || '';
          if (rawText.trim() && rawText !== this.lastProcessedMessage) {
            this.lastProcessedMessage = rawText;
            this.parseAICommand(rawText);
          }
        }
      });
    };
    window.addEventListener('ai-messages-update', this.messageUpdateHandler);
  }

  parseAICommand(message: string) {
    // Attempt to extract markdown JSON block or raw JSON braces/brackets
    const jsonStrMatch = message.match(/```(?:json)?\s*([\s\S]*?)```/) || message.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    
    if (jsonStrMatch) {
      try {
        const parsed = JSON.parse(jsonStrMatch[1] || jsonStrMatch[0]);
        let fieldsArray: any[] = [];
        let extractedTitle = '';

        if (Array.isArray(parsed)) {
          fieldsArray = parsed;
        } else if (parsed && Array.isArray(parsed.fields)) {
          fieldsArray = parsed.fields;
          extractedTitle = parsed.title || '';
        }

        if (fieldsArray.length > 0) {
          // Fallback title extraction if missing from JSON structure
          if (!extractedTitle) {
            const textBefore = message.substring(0, message.indexOf(jsonStrMatch[0])).trim();
            const titleMatch = textBefore.match(/(?:form[:\s]+|for\s+(?:a|an)\s+|titled?\s*[:\-]?\s*)["']?([A-Za-z0-9 &\-\/]+)["']?/i)
              || textBefore.match(/^(?:Here(?:'s| is)(?: a| an)?|Creating(?: a| an)?|Generating(?: a| an)?) ([^\n.!?]+)/im);
            if (titleMatch) {
              extractedTitle = titleMatch[titleMatch.length - 1].trim();
            }
          }

          if (extractedTitle && extractedTitle.length > 3) {
            this.formDisplayName = extractedTitle;
            this.formName = extractedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          }

          fieldsArray.forEach(field => {
            if (field.type && (field.label || field.name)) {
              this.addAIField(field.type, field.label || field.name, field);
            }
          });

          this.isDirty = true;
          this.snackBar.open(`AI successfully generated ${fieldsArray.length} fields!`, 'Brilliant', { duration: 5000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['snackbar-ai'] });
          return;
        }
      } catch (e) {
        console.warn('AI JSON Parsing failed, falling back to regex...', e);
      }
    }

    // Fallback legacy regex parser for single commands
    const regex = /ADD_FIELD:\s*type[:\s]+(\w+)[,\s]+label[:\s]+([^\\n.|!]+)/i;
    const match = message.match(regex);
    if (match) {
      const type = match[1].toLowerCase().trim();
      const label = match[2].trim();
      this.addAIField(type, label);
    }
  }

  addAIField(type: string, label: string, fullConfig?: any) {
    const validTool = this.availableTools.find(t => t.type === type);
    if (!validTool) return;

    const fieldName = fullConfig?.name || (label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substring(7));
    const newField: FieldConfig = {
      type: type as any,
      name: fieldName,
      label: label,
      placeholder: fullConfig?.placeholder || `Enter ${label}...`,
      required: fullConfig?.required || false,
      width: fullConfig?.width || '100%',
      options: fullConfig?.options || ((type === 'dropdown' || type === 'radio' || type === 'multiselect') ? [{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }] : undefined),
      precision: fullConfig?.precision,
      currency: fullConfig?.currency,
      headingTextAlignment: fullConfig?.headingTextAlignment || 'left',
      min: fullConfig?.min,
      max: fullConfig?.max,
     
    };
    this.formConfig = [...this.formConfig, newField];
    this.isDirty = true;
    if (!fullConfig) {
      this.snackBar.open(`AI added a new ${type} field: "${label}"`, 'Awesome!', { duration: 4000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['snackbar-ai'] });
    }
  }

  mode: 'edit' | 'view' = 'edit';

  toggleMode() {
    this.mode = this.mode === 'edit' ? 'view' : 'edit';
    if (this.mode === 'edit') this.submittedData = null;
  }

  isDirty: boolean = false;
  id = '';
  isLoading: boolean = false;
  
  loadForm(formId: string) {
    this.isLoading = true;
    this.http.get<any[]>(`${this.apiUrl}/forms`).subscribe({
      next: (forms) => {
        const form = forms.find(f => f._id === formId || f.name === formId);
        if (form) {
            this.formConfig = [...form.config];
            this.formName = form.name;
            this.formDisplayName = form.displayName;
            this.isDirty = false;
            this.id = form._id;
          } else {
            this.openAlert('Error', 'Form not found', 'error');
            this.router.navigate(['/']);
          }
          this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading forms:', err);
        this.isLoading = false;
      }
    });
  }

  exportConfig() {
    console.log('Exported Form Configuration:', JSON.stringify(this.formConfig, null, 2));
    this.openAlert('Exported!', 'Form config exported to browser console.', 'success');
  }

  async clearConfig() {
    const ok = await this.openConfirm('Clear Form', 'Are you sure you want to clear the entire form?', 'danger', 'Yes, Clear', 'Cancel');
    if (ok) {
      this.isDirty = false;
      this.createNewForm(true);
    }
  }

  async createNewForm(afterSave: boolean = false) {
    if (this.isDirty && !afterSave) {
      const ok = await this.openConfirm('Unsaved Changes', 'You have unsaved changes. Start a new form anyway?', 'warning', 'Yes, Start New', 'Cancel');
      if (!ok) return;
    }
    this.formConfig = [];
    this.formName = 'untitled_form';
    this.formDisplayName = 'Untitled Form';
    this.isDirty = false;
    this.submittedData = null;
    this.id = '';
    
    // Explicitly update URL to clean out stale IDs if needed
    if (!afterSave) {
        this.router.navigate(['/builder/new']);
    }
  }

  saveConfig() {
    const formData = {
      name: this.formName,
      displayName: this.formDisplayName,
      config: this.formConfig,
      _id: this.id || undefined
    };
    this.http.post(`${this.apiUrl}/forms`, formData).subscribe({
      next: (res: any) => {
        this.isDirty = false;
        this.id = res._id; // Ensure we maintain ID after creation
        this.snackBar.open(`"${this.formDisplayName}" saved successfully!`, 'OK', { duration: 3000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['snackbar-success'] });
      },
      error: (err) => {
        console.error('Error saving form:', err);
        this.snackBar.open(`Failed to save. ${err.error?.error || ''}`, 'Dismiss', { duration: 4000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['snackbar-error'] });
      }
    });
  }

  tabs = [{ id: 'tab1', label: 'Fields' }, { id: 'tab2', label: 'Actions' }];
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
    { type: 'toggle', label: 'Boolean', icon: 'toggle_on' },
    { type: 'heading', label: 'Heading', icon: 'view_headline' }
  ];

  formConfig: FieldConfig[] = [];
  submittedData: any = null;
  formName: string = 'untitled_form';
  formDisplayName: string = 'Untitled Form';

  onFormSubmit(value: any) {
    const finalData = { formId: this.id || this.formName, data: value };
    this.http.post(`${this.apiUrl}/responses`, finalData).subscribe({
      next: (res) => {
        this.submittedData = value;
        this.openAlert('Submitted!', 'Your form response has been saved.', 'success');
      },
      error: (err) => this.openAlert('Submission Failed', 'Could not submit the form to the backend.', 'error')
    });
  }

  onConfigChange(newConfig: FieldConfig[]) {
    this.formConfig = newConfig;
    this.isDirty = true;
  }
}
