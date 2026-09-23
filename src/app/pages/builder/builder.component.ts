import { Component, OnInit, NgZone, inject, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { exhaustMap, firstValueFrom, tap } from 'rxjs';
import {BuilderTools} from '../../shared/tools/builderTools';
import { DynamicFormComponent } from '../../dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../dynamic-form/models/field-config.interface';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/analytics/services/auth.service';
import { AiFormService } from '../../services/ai-form.service';
import { AiFormGeneratorDialogComponent} from '../../shared/dialogs/ai-form-generator-dialog/ai-form-generator-dialog.component';
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

  public isFieldEditing: boolean = false;
  @ViewChild('formCanvas') formCanvas!: ElementRef;

  // AI review & undo state
  aiPreviousState: {
    formConfig: FieldConfig[];
    formDisplayName: string;
    formName: string;
    isDirty: boolean;
  } | null = null;
  hasAiPendingChanges: boolean = false;
  aiNewFieldsCount: number = 0;
  aiModifiedFieldsCount: number = 0;
  aiDeletedFields: string[] = [];
  aiChangesSummary: string = '';
  
  constructor(
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    public builderTools: BuilderTools,
    private authService:AuthService,
    private aiFormService: AiFormService
  ) { }

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

  saveAiSnapshot(summary: string = '') {
    if (!this.hasAiPendingChanges || !this.aiPreviousState) {
      this.aiPreviousState = {
        formConfig: JSON.parse(JSON.stringify(this.formConfig)),
        formDisplayName: this.formDisplayName,
        formName: this.formName,
        isDirty: this.isDirty
      };
    }
  }

  undoAiChanges(): void {
    if (!this.aiPreviousState) return;

    this.formConfig = JSON.parse(JSON.stringify(this.aiPreviousState.formConfig));
    this.formDisplayName = this.aiPreviousState.formDisplayName;
    this.formName = this.aiPreviousState.formName;
    this.isDirty = this.aiPreviousState.isDirty;

    this.hasAiPendingChanges = false;
    this.aiPreviousState = null;
    this.aiChangesSummary = '';
    this.aiNewFieldsCount = 0;
    this.aiModifiedFieldsCount = 0;
    this.aiDeletedFields = [];

    this.snackBar.open('AI changes undone. Form restored to previous state.', 'Dismiss', {
      duration: 3500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snackbar-info']
    });
  }

  keepAiChanges(silent: boolean = false): void {
    // Strip isAiAdded and isAiModified flags from fields
    this.formConfig = this.formConfig.map(f => {
      if (f.isAiAdded || f.isAiModified) {
        const { isAiAdded, isAiModified, ...rest } = f;
        return rest;
      }
      return f;
    });

    this.hasAiPendingChanges = false;
    this.aiPreviousState = null;
    this.aiChangesSummary = '';
    this.aiNewFieldsCount = 0;
    this.aiModifiedFieldsCount = 0;
    this.aiDeletedFields = [];

    if (!silent) {
      this.snackBar.open('AI changes kept successfully!', 'OK', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['snackbar-success']
      });
    }
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
          this.saveAiSnapshot(`AI Chatbot added ${fieldsArray.length} field(s)`);

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

          let addedCount = 0;
          fieldsArray.forEach(field => {
            if (field.type && (field.label || field.name)) {
              this.addAIField(field.type, field.label || field.name, field, true);
              addedCount++;
            }
          });

          this.hasAiPendingChanges = true;
          this.aiNewFieldsCount = addedCount;
          this.aiChangesSummary = `AI Assistant added ${addedCount} new ${addedCount === 1 ? 'field' : 'fields'}.`;
          this.isDirty = true;
          this.snackBar.open(`AI added ${addedCount} fields! You can Keep or Undo changes.`, 'Review', { duration: 5000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['snackbar-ai'] });
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
      this.saveAiSnapshot(`AI Assistant added ${type} field "${label}"`);
      this.addAIField(type, label, undefined, true);
      this.hasAiPendingChanges = true;
      this.aiNewFieldsCount = 1;
      this.aiChangesSummary = `AI Assistant added 1 new ${type} field: "${label}".`;
    }
  }

  addAIField(type: string, label: string, fullConfig?: any, isAiAdded: boolean = true, isAiModified: boolean = false) {
    const validTool = this.availableTools.find(t => t.type === type);
    if (!validTool) return;

    const fieldName = fullConfig?.name || (label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substring(7));
    const newField: FieldConfig = {
      type: type as any,
      name: fieldName,
      label: label,
      value: fullConfig?.value,
      placeholder: fullConfig?.placeholder || `Enter ${label}...`,
      required: fullConfig?.required || false,
      disabled: fullConfig?.disabled || false,
      width: fullConfig?.width || '100%',
      options: fullConfig?.options || ((type === 'dropdown' || type === 'radio' || type === 'multiselect') ? [{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }] : undefined),
      precision: fullConfig?.precision,
      currency: fullConfig?.currency,
      headingTextAlignment: fullConfig?.headingTextAlignment || 'left',
      min: fullConfig?.min,
      max: fullConfig?.max,
      pattern: fullConfig?.pattern,
      isAiAdded: isAiAdded,
      isAiModified: isAiModified
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
    this.http.get<any>(`${this.apiUrl}/forms/${formId}`).subscribe({
      next: (form) => {
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

  async onFileImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (parseError) {
        this.openAlert('Invalid JSON', 'The selected file is not a valid JSON document.', 'error');
        return;
      }

      // Handle various JSON structures (array, { fields: [...] }, { config: [...] }, or API response formats)
      let importedFields: any[] = [];
      let importedDisplayName = '';
      let importedFormName = '';

      if (Array.isArray(parsed)) {
        // Direct array of fields (e.g. from exportConfig)
        importedFields = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.fields)) {
          importedFields = parsed.fields;
        } else if (Array.isArray(parsed.config)) {
          importedFields = parsed.config;
        } else if (parsed.data && Array.isArray(parsed.data.fields)) {
          importedFields = parsed.data.fields;
        } else if (parsed.data && Array.isArray(parsed.data.config)) {
          importedFields = parsed.data.config;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          importedFields = parsed.data;
        }

        importedDisplayName = parsed.formDisplayName || parsed.displayName || parsed.title || '';
        importedFormName = parsed.formName || parsed.name || '';
      }

      if (!Array.isArray(importedFields) || importedFields.length === 0) {
        this.openAlert('Import Failed', 'The selected JSON file does not contain any form fields or configuration.', 'warning');
        return;
      }

      // Filter and validate fields
      const validTools = new Set(this.availableTools.map(t => t.type));
      const sanitizedFields: FieldConfig[] = [];

      for (let i = 0; i < importedFields.length; i++) {
        const item = importedFields[i];
        if (!item || typeof item !== 'object') continue;

        const fieldType = (item.type || 'text').toString().toLowerCase().trim();
        const safeType = validTools.has(fieldType) ? fieldType : 'text';
        const label = item.label || item.name || `Field ${i + 1}`;
        const name = item.name || (label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substring(7));

        const field: FieldConfig = {
          type: safeType as any,
          name: name,
          label: label,
          value: item.value,
          placeholder: item.placeholder || `Enter ${label}...`,
          required: Boolean(item.required),
          disabled: Boolean(item.disabled),
          width: item.width || '100%',
          options: item.options || ((safeType === 'dropdown' || safeType === 'radio' || safeType === 'multiselect') ? [
            { label: 'Option 1', value: '1' },
            { label: 'Option 2', value: '2' }
          ] : undefined),
          precision: item.precision,
          currency: item.currency,
          headingTextAlignment: item.headingTextAlignment || 'left',
          min: item.min,
          max: item.max,
          pattern: item.pattern
        };
        sanitizedFields.push(field);
      }

      if (sanitizedFields.length === 0) {
        this.openAlert('Import Failed', 'No valid form fields could be extracted from the file.', 'error');
        return;
      }

      // Prompt confirmation if current form is not empty
      if (this.isDirty || this.formConfig.length > 0) {
        const confirm = await this.openConfirm(
          'Overwrite Current Form?',
          `Importing this configuration will replace your current form (${this.formConfig.length} field${this.formConfig.length === 1 ? '' : 's'}). Are you sure you want to continue?`,
          'warning',
          'Yes, Import',
          'Cancel'
        );
        if (!confirm) {
          return;
        }
      }

      // Reset AI review banner / states
      this.hasAiPendingChanges = false;
      this.aiPreviousState = null;
      this.submittedData = null;

      // Determine form name and display name
      if (importedDisplayName) {
        this.formDisplayName = importedDisplayName;
      } else {
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
        this.formDisplayName = baseName ? (baseName.charAt(0).toUpperCase() + baseName.slice(1)) : 'Imported Form';
      }

      if (importedFormName) {
        this.formName = importedFormName;
      } else {
        this.formName = this.formDisplayName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      }

      // Reset ID to create clean imported form
      this.id = '';
      this.formConfig = [...sanitizedFields];
      this.isDirty = true;

      this.snackBar.open(`"${this.formDisplayName}" imported successfully with ${sanitizedFields.length} field${sanitizedFields.length === 1 ? '' : 's'}!`, 'OK', {
        duration: 4000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['snackbar-success']
      });

    } catch (e: any) {
      console.error('File import error:', e);
      this.openAlert('Import Error', `Could not read file: ${e?.message || 'Unknown error'}`, 'error');
    } finally {
      input.value = '';
    }
  }

  exportConfig() {
    if (!this.formConfig || this.formConfig.length === 0) {
      return;
    }
    const blob = new Blob([JSON.stringify(this.formConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.formName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open(`"${this.formDisplayName}" exported successfully!`, 'OK', { duration: 3000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['snackbar-success'] });
  }

  async clearConfig() {
    const ok = await this.openConfirm('Clear Form', 'Are you sure you want to clear the entire form?', 'danger', 'Yes, Clear', 'Cancel');
    if (ok) {
      this.hasAiPendingChanges = false;
      this.aiPreviousState = null;
      this.isDirty = false;
      this.createNewForm(true);
    }
  }

  async createNewForm(afterSave: boolean = false) {
    if (this.isDirty && !afterSave) {
      const ok = await this.openConfirm('Unsaved Changes', 'You have unsaved changes. Start a new form anyway?', 'warning', 'Yes, Start New', 'Cancel');
      if (!ok) return;
    }
    this.hasAiPendingChanges = false;
    this.aiPreviousState = null;
    this.formConfig = [];
    this.formName = 'untitled_form';
    this.formDisplayName = 'Untitled Form';
    this.isDirty = false;
    this.submittedData = null;
    this.id = '';

    // Explicitly update URL to clean out stale IDs if needed
    // if (!afterSave) {
      this.router.navigate(['/builder/new']);
    // }
  }

  saveConfig() {
    if(!this.formBuilderSaveValidations()){
      return;
    }

    if (this.hasAiPendingChanges) {
      this.keepAiChanges(true);
    }
    
    const formData = {
      name: this.formName,
      displayName: this.formDisplayName,
      config: this.formConfig,
      _id: this.id || undefined,
      createdBy:this.authService.getUserid()
    };
    this.http.post(`${this.apiUrl}/forms`, formData).subscribe({
      next: (res: any) => {
        this.isDirty = false;
        this.id = res._id; // Ensure we maintain ID after creation
        this.snackBar.open(`"${this.formDisplayName}" saved successfully!`, 'OK', { duration: 3000, horizontalPosition: 'right', verticalPosition: 'top', panelClass: ['snackbar-success'] });
        this.createNewForm(true);
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
    { type: 'text', label: 'Text Input', icon: "edit", class: "btn-icon edit-btn" },
    { type: 'textarea', label: 'Text Area', icon: 'description' },
    { type: 'email', label: 'Email', icon: 'email' },
    { type: 'password', label: 'Password', icon: 'lock' },
    { type: 'number', label: 'Number', icon: 'pin' },
    { type: 'decimal', label: 'Decimal', icon: 'calculate' },
    { type: 'currency', label: 'Currency', icon: 'currency_rupee' },
    { type: 'mobile', label: 'Mobile Number', icon: 'phone' },
    { type: 'date', label: 'Date Picker', icon: 'calendar_today' },
    { type: 'timestamp', label: 'Date & Time (Timestamp)', icon: 'schedule' },
    { type: 'dropdown', label: 'Dropdown Select', icon: 'arrow_drop_down' },
    { type: 'multiselect', label: 'Multi-Select', icon: 'check_box_outline_blank' },
    { type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
    { type: 'radio', label: 'Radio Buttons', icon: 'radio_button_checked' },
    { type: 'toggle', label: 'Boolean', icon: 'toggle_on' },
    { type: 'heading', label: 'Heading', icon: 'view_headline' },
    { type: 'file', label: 'File Upload', icon: 'file_upload' }
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
    const isNewFieldAdded = this.formConfig && newConfig && newConfig.length > this.formConfig.length;
    this.formConfig = newConfig;
    this.isDirty = true;

    if (this.hasAiPendingChanges) {
      const remainingAiFields = this.formConfig.filter(f => f.isAiAdded);
      this.aiNewFieldsCount = remainingAiFields.length;
      if (remainingAiFields.length === 0) {
        this.hasAiPendingChanges = false;
        this.aiPreviousState = null;
        this.aiChangesSummary = '';
      }
    }

    if (isNewFieldAdded) {
      setTimeout(() => {
        if (this.formCanvas) {
          const container = this.formCanvas.nativeElement;
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  }
  onToolOpen(){
    setTimeout(() => {
        if (this.formCanvas) {
          const container = this.formCanvas.nativeElement;
          console.log('Current Scroll:', container.scrollTop, 'Total Height:', container.scrollHeight);

          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
  }
  formBuilderSaveValidations(){
    if(this.formName === ''){
      this.openAlert('Error', 'Form name is required', 'error');
      return false;
    }
    if(this.formConfig.length === 0){
      this.openAlert('Error', 'Form is empty', 'error');
      return false;
    }
    if(this.isFieldEditing){
      this.openAlert('Error','Kindly complete the field configuration','error');
      return false;
    }
    return true;
  }


  openAiGenerator(): void {
  const dialogRef = this.dialog.open(
    AiFormGeneratorDialogComponent,
    {
      width: '600px',
      disableClose: true,
      data: {
        hasExistingForm: this.formConfig.length > 0
      }
    }
  );

  dialogRef.afterClosed().subscribe(
    (prompt: string | undefined) => {

      if (prompt) {
        this.generateFormWithAI(prompt);
      }

    }
  );
}

  generateFormWithAI(prompt: string): void {

    if (!prompt || !prompt.trim()) {
      this.openAlert(
        'AI Form Generator',
        'Please describe the form you want to create.',
        'warning'
      );
      return;
    }
    this.isLoading = true;
    this.aiFormService.generateForm(prompt, {
    formName: this.formDisplayName,
    fields: this.formConfig as any
  }).subscribe({

     next: (response) => {

        console.log('AI Form Response:', response);

        if (!response?.fields?.length) {

          this.openAlert(
            'AI Form Generator',
            'The AI did not generate any fields.',
            'warning'
          );

          this.isLoading = false;
          return;
        }

        // Save snapshot before applying AI changes
        this.saveAiSnapshot(`AI generated fields based on prompt: "${prompt}"`);

        const prevFields = [...this.formConfig];
        const existingNames = new Set(prevFields.map(f => (f.name || '').toLowerCase()));
        const existingLabels = new Set(prevFields.map(f => (f.label || '').toLowerCase()));
        const prevFieldMap = new Map(prevFields.map(f => [(f.name || '').toLowerCase(), f]));
        const hadExistingFields = prevFields.length > 0;

        // Reset and rebuild form
        this.formConfig = [];

        // Set form name
        this.formDisplayName =
          response.formName || this.formDisplayName || 'AI Generated Form';

        this.formName = this.formDisplayName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');

        let newCount = 0;
        let modifiedCount = 0;
        const responseNames = new Set(response.fields.map(f => (f.name || '').toLowerCase()));
        const responseLabels = new Set(response.fields.map(f => (f.label || '').toLowerCase()));

        // Add generated fields
        response.fields.forEach(field => {
          const lowerName = (field.name || '').toLowerCase();
          const lowerLabel = (field.label || '').toLowerCase();
          const isBrandNew = !hadExistingFields ||
            (!existingNames.has(lowerName) && !existingLabels.has(lowerLabel));

          let isModified = false;
          if (!isBrandNew && hadExistingFields) {
            const original = prevFieldMap.get(lowerName) || prevFields.find(f => (f.label || '').toLowerCase() === lowerLabel);
            if (original) {
              if (Boolean(original.required) !== Boolean(field.required) ||
                  original.type !== field.type ||
                  (original.width || '100%') !== (field.width || '100%') ||
                  original.label !== field.label ||
                  (original.placeholder || '') !== (field.placeholder || '') ||
                  JSON.stringify(original.options || []) !== JSON.stringify(field.options || [])) {
                isModified = true;
                modifiedCount++;
              }
            }
          }

          if (isBrandNew) newCount++;

          this.addAIField(
            field.type,
            field.label,
            field,
            isBrandNew,
            isModified
          );
        });

        // Detect deleted fields
        const deletedFields: string[] = [];
        if (hadExistingFields) {
          prevFields.forEach(pf => {
            const pName = (pf.name || '').toLowerCase();
            const pLabel = (pf.label || '').toLowerCase();
            if (!responseNames.has(pName) && !responseLabels.has(pLabel)) {
              deletedFields.push(pf.label || pf.name);
            }
          });
        }

        this.aiDeletedFields = deletedFields;
        this.aiNewFieldsCount = newCount;
        this.aiModifiedFieldsCount = modifiedCount;

        // Build descriptive summary
        const summaryParts: string[] = [];
        if (newCount > 0) summaryParts.push(`added ${newCount} ${newCount === 1 ? 'field' : 'fields'}`);
        if (modifiedCount > 0) summaryParts.push(`modified ${modifiedCount} ${modifiedCount === 1 ? 'field' : 'fields'}`);
        if (deletedFields.length > 0) summaryParts.push(`removed ${deletedFields.length} ${deletedFields.length === 1 ? 'field' : 'fields'} (${deletedFields.join(', ')})`);

        if (summaryParts.length === 0) {
          this.aiChangesSummary = `AI updated the form configuration.`;
        } else {
          this.aiChangesSummary = `AI ${summaryParts.join(', ')}.`;
        }

        this.hasAiPendingChanges = true;
        this.isDirty = true;

        this.snackBar.open(
          `AI generated ${response.fields.length} fields! You can Keep or Undo changes.`,
          'Review',
          {
            duration: 6000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['snackbar-ai']
          }
        );

        this.isLoading = false;

        // Scroll to generated form
        setTimeout(() => {

          if (this.formCanvas) {

            const container =
              this.formCanvas.nativeElement;

            container.scrollTo({
              top: 0,
              behavior: 'smooth'
            });

          }

        }, 100);

      },

      error: (error) => {

        console.error(
          'AI form generation failed:',
          error
        );

        this.isLoading = false;

        const errorMsg = error?.error?.error || error?.error?.message || error?.message || 'Unable to generate the form. Please try again.';

        this.openAlert(
          'AI Form Generator',
          errorMsg,
          'error'
        );

      }

    });
  }
}
