import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
@Output() onLogin = new EventEmitter<void>();
   userObject = {
    email: '',
    password: ''
  }
  constructor(private router: Router) {}
  login() {
    console.log(this.userObject);
    this.onLogin.emit();
    this.router.navigate(['/dashboard']);
    console.log('Login');
  }
}
