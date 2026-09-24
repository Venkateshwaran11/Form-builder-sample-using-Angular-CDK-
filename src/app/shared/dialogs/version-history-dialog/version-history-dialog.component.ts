import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormVersionSummary, FormDiffResult } from '../../../dynamic-form/models/field-config.interface';
import { FormDiffService } from '../../../services/form-diff.service';
import { FormVersionService } from '../../../services/version.service';

@Component({
  selector: 'app-version-history-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './version-history-dialog.component.html',
  styleUrl: './version-history-dialog.component.css'
})
export class VersionHistoryDialogComponent implements OnInit {
  private versionService = inject(FormVersionService);
  private diffService = inject(FormDiffService);

  versions: FormVersionSummary[] = [];
  selectedVersionA: any = null;
  selectedVersionB: any = 'draft';
  diffResult: FormDiffResult | null = null;
  isLoading = true;
  activeView: 'visual' | 'changelog' = 'visual';

  constructor(
    public dialogRef: MatDialogRef<VersionHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { formId: string; formDisplayName: string; currentVersion?: number }
  ) {}

  ngOnInit() {
    this.loadVersions();
  }

  loadVersions() {
    this.isLoading = true;
    this.versionService.getVersions(this.data.formId).subscribe({
      next: (res) => {
        this.versions = res.versions || [];
        if (this.versions.length > 0) {
          this.selectedVersionA = this.versions[this.versions.length > 1 ? 1 : 0].version;
          this.selectedVersionB = res.hasDraftChanges ? 'draft' : this.versions[0].version;
          this.runComparison();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  runComparison() {
    if (!this.selectedVersionA || !this.selectedVersionB) return;
    this.isLoading = true;
    this.versionService.compareVersions(this.data.formId, this.selectedVersionA, this.selectedVersionB).subscribe({
      next: (res) => {
        this.diffResult = this.diffService.compare(
          res.vA.config,
          res.vB.config,
          res.vA.label,
          res.vB.label
        );
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  restoreSelected() {
    if (!this.selectedVersionA || this.selectedVersionA === 'draft') return;
    if (confirm(`Are you sure you want to restore Version ${this.selectedVersionA} to your working draft?`)) {
      this.versionService.restoreVersion(this.data.formId, Number(this.selectedVersionA)).subscribe({
        next: (res) => {
          this.dialogRef.close({ restored: true, form: res.form });
        }
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}