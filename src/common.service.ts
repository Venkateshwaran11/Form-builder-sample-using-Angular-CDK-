import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class CommonService {
     message: string = "Hello from Common Service";
     constructor() {
          console.log("CommonService instance created");
          console.log(this.message);
     }
}