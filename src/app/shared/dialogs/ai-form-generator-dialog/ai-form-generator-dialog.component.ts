import {
  Component,
  Inject
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import {
  FormsModule
} from '@angular/forms';

import {
  CommonModule
} from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-ai-form-generator-dialog',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIcon,
    MatButton
  ],

  templateUrl: './ai-form-generator-dialog.component.html',
  styleUrls: ['./ai-form-generator-dialog.component.css']
})
export class AiFormGeneratorDialogComponent {

  prompt = '';
  isLoading = false;

  constructor(private dialogRef: MatDialogRef<AiFormGeneratorDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  generate() {

    if (!this.prompt.trim()) {
      return;
    }

    this.isLoading = true;
    this.dialogRef.close(
      this.prompt.trim()
    );
  }

  close() {
    this.dialogRef.close();
  }
}