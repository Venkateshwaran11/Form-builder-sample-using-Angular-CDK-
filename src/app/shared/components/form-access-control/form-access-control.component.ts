import { Component, inject, Input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-form-access-control',
  standalone: true,
  imports: [MatIconModule, MatOption, FormsModule],
  templateUrl: './form-access-control.component.html',
  styleUrl: './form-access-control.component.css'
})
export class FormAccessControlComponent {
  @Input() formId :string='';
  selectedVisibility: 'public' | 'restricted' | 'private' = 'public';

  roleList = [
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer' },
    { label: 'Respondent', value: 'respondent' }
  ];
  selectedRole: string = 'editor';
  private router = inject(Router);
   copyUrl = signal(window.location.origin + this.router.serializeUrl(
      this.router.createUrlTree(['/f', this.formId])
    )).asReadonly();
  copyLink() {
    const url = window.location.origin + this.router.serializeUrl(
      this.router.createUrlTree(['/f', this.formId])
    );
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }
}
