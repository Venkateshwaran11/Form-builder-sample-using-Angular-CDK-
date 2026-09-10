import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success toast message
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  success(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-success']
    });
  }

  /**
   * Show error toast message
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 5000)
   */
  error(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-error']
    });
  }

  /**
   * Show info toast message
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  info(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-info']
    });
  }

  /**
   * Show warning toast message
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 4000)
   */
  warning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-warning']
    });
  }

  /**
   * Show custom toast message
   * @param message The message to display
   * @param config Custom MatSnackBarConfig
   */
  custom(message: string, config?: MatSnackBarConfig): void {
    const defaultConfig: MatSnackBarConfig = {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      ...config
    };
    this.snackBar.open(message, 'Close', defaultConfig);
  }
}
