import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-drop-target',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './drop-target.component.html',
  styleUrl: './drop-target.component.css'
})
export class DropTargetComponent {
  activeWidgets: string[] = [
    'Welcome Dashboard Info',
    'Active Users'
  ];

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}
