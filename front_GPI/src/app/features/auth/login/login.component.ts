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
    // Le regex autorise le matricule seul (I12345), @etu.iscae.mr, @prof.iscae.mr et @iscae.mr
    const emailRegex = /^(I\d+|I\d+@etu\.iscae\.mr|[a-zA-Z0-9._-]+@prof\.iscae\.mr|[a-zA-Z0-9._-]+@iscae\.mr)$/;
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(emailRegex)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  get isStudent(): boolean {
    const email = this.loginForm.get('email')?.value;
    return email ? /^(I\d+|I\d+@etu\.iscae\.mr)$/i.test(email) : false;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';

    const loginCredentials = { ...this.loginForm.value };
    
    // 1. Passage de l'email en minuscules pour éviter les conflits de casse
    loginCredentials.email = loginCredentials.email.toLowerCase().trim();

    // 2. Si c'est un matricule seul (ex: i12345), on le transforme au format requis
    if (/^I\d+$/i.test(loginCredentials.email)) {
      loginCredentials.email = `${loginCredentials.email.toUpperCase()}@etu.iscae.mr`;
    }

    this.authService.login(loginCredentials).subscribe({
      next: (res) => {
        this.isLoading = false;

        if (!res.user || !res.user.role) {
          this.errorMessage = "Impossible de récupérer le rôle de l'utilisateur.";
          return;
        }

        // 3. Sécurisation du rôle reçu (on retire les majuscules et les espaces)
        const role = res.user.role.toLowerCase().trim();
        
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));

        // 4. Redirections basées sur le rôle nettoyé
        if (role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (role === 'enseignant') {
          this.router.navigate(['/teacher']);
        } else if (role === 'etudiant') {
          this.router.navigate(['/student']);
        } else {
          // Fallback au cas où le rôle renvoyé est inconnu
          this.errorMessage = `Rôle non reconnu (${role}). Contactez le support.`;
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