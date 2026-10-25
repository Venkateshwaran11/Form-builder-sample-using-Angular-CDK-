import { Component, Inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { FormTemplate, FormTemplateService } from '../../services/form-template.service';

export interface TemplateGalleryDialogData {
  title?: string;
}

@Component({
  selector: 'app-template-gallery-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, FormsModule],
  templateUrl: './template-gallery-dialog.component.html',
  styleUrl: './template-gallery-dialog.component.css'
})
export class TemplateGalleryDialogComponent implements OnInit {
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  previewTemplate = signal<FormTemplate | null>(null);

  categories: string[] = [];
  templates: FormTemplate[] = [];

  filteredTemplates = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.templates.filter(t => {
      const matchCat = cat === 'All' || t.category === cat;
      const matchQuery = !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  });

  constructor(
    public dialogRef: MatDialogRef<TemplateGalleryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TemplateGalleryDialogData,
    private templateService: FormTemplateService
  ) {}

  ngOnInit(): void {
    this.templates = this.templateService.getTemplates();
    this.categories = this.templateService.getCategories();
  }

  setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  openPreview(tmpl: FormTemplate) {
    this.previewTemplate.set(tmpl);
  }

  closePreview() {
    this.previewTemplate.set(null);
  }

  selectTemplate(tmpl: FormTemplate) {
    this.dialogRef.close(tmpl);
  }

  close() {
    this.dialogRef.close(null);
  }
}
