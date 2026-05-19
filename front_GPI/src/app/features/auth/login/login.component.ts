import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const emailRegex = /^(I\d+@etu\.iscae\.mr|[a-zA-Z0-9._-]+@iscae\.mr)$/;
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(emailRegex)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  get isStudent(): boolean {
    const email = this.loginForm.get('email')?.value;
    return email ? /^I\d+@etu\.iscae\.mr$/.test(email) : false;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        const role = res.user.role;
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));

        if (role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (role === 'enseignant') {
          this.router.navigate(['/teacher']);
        } else {
          this.router.navigate(['/student']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error?.errors?.email) {
          this.errorMessage = err.error.errors.email[0];
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.';
        }
      }
    });
  }
}