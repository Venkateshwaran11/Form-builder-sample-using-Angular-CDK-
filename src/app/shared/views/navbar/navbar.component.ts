import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from "@angular/material/icon";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/analytics/services/auth.service';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatIcon, RouterLink, RouterLinkActive, MatDialogModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
   @Input() isViewerMode: boolean = false;
   private dialog = inject(MatDialog);

   constructor(public authService: AuthService) { }

   async logout() {
     const ref = this.dialog.open(ConfirmDialogComponent, {
       data: {
         title: 'Confirm Logout',
         message: 'Are you sure you want to log out of FormBuilder Pro?',
         confirmText: 'Logout',
         cancelText: 'Cancel',
         type: 'warning'
       },
       width: '440px',
       disableClose: true,
       panelClass: 'mat-dialog-clean'
     });

     const confirmed = await firstValueFrom(ref.afterClosed());
     if (confirmed) {
       this.authService.logout();
     }
   }
}
