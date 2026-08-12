import { CanDeactivateFn } from '@angular/router';
import { BuilderComponent } from '../pages/builder/builder.component';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

export const unsavedChangesGuard: CanDeactivateFn<BuilderComponent> = async (component, currentRoute, currentState, nextState) => {
  if (component.isDirty) {
    const dialog = inject(MatDialog)
    const result = dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        type: 'warning',
        confirmText: 'Yes',
        cancelText: 'No'
      },
      width: '440px',
      disableClose: true,
      panelClass: 'mat-dialog-clean'
    })
    const isConfirmed = await firstValueFrom(result.afterClosed());
    return isConfirmed === true;
  }
  return true;
};
