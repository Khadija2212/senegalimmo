import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open('Connexion réussie !', 'Fermer', { duration: 3000 });
        this.redirectByRole(response.user.role);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || 'Email ou mot de passe incorrect',
          'Fermer',
          { duration: 3000 }
        );
      }
    });
  }

  redirectByRole(role: string) {
    switch (role) {
      case 'administrateur':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'proprietaire':
        this.router.navigate(['/proprietaire/dashboard']);
        break;
      case 'client':
        this.router.navigate(['/client/dashboard']);
        break;
      case 'agent':
        this.router.navigate(['/agent/dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
}