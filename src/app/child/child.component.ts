import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonService } from '../../common.service';
@Component({
  selector: 'app-child',
  standalone: true,
  imports: [],
  providers: [CommonService],
  templateUrl: './child.component.html',
  styleUrl: './child.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChildComponent {
@Input () message: string = '';
@Input () user: {name:string,count?:number}= {name:''};
@Output()  notify: EventEmitter<string> = new EventEmitter<string>();
constructor(public CommonService:CommonService) {
}
public changes: SimpleChanges = {};
ngOnInit() {
  this.notify.emit("Hello from Child Component!");
  console.log(this.CommonService.message="Hello from ChildComponent using Common Service");
}
 ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    this.changes = changes;
  }
  updateMessage() {
    this.message = "Message updated by Child Component";
    this.user.name = "Updated User Name from Child Component";
  }
}
