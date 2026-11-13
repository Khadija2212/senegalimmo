import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('password_confirmation')?.value;
  return password === confirmation ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  roles = [
    { value: 'client', label: 'Client (Locataire & Acquéreur)' },
    { value: 'proprietaire', label: 'Propriétaire' },
    { value: 'agent', label: 'Agent immobilier' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group(
      {
        role: ['', Validators.required],
        prenom: ['', Validators.required],
        nom: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\s]{9,15}$/)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        password_confirmation: ['', Validators.required],
      },
      { validators: passwordsMatch }
    );
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open('Compte créé avec succès !', 'Fermer', { duration: 3000 });
        this.redirectByRole(response.user.role);
      },
      error: (err: any) => {
        this.isLoading = false;
        let message = 'Erreur lors de l\'inscription';
        if (err.error?.errors) {
          message = Object.values(err.error.errors).flat().join(' ');
        } else if (err.error?.message) {
          message = err.error.message;
        }
        this.snackBar.open(message, 'Fermer', { duration: 5000 });
      }
    });
  }

  redirectByRole(role: string) {
    this.router.navigate([`/${role}/dashboard`]);
  }
}