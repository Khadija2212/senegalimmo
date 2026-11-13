import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminUsersService } from '../../../services/admin-users';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-utilisateurs-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './utilisateurs-admin.html',
  styleUrls: ['./utilisateurs-admin.css']
})
export class UtilisateursAdmin implements OnInit {
  users: any[] = [];
  isLoading = true;
  message = '';
  error = '';

  search = '';
  selectedRole = '';
  selectedStatut = '';

  constructor(
    private adminUsers: AdminUsersService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'administrateur') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.adminUsers.getUsers({
      search: this.search,
      role: this.selectedRole,
      statut: this.selectedStatut
    }).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des utilisateurs.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleStatut(u: any): void {
    this.message = '';
    this.error = '';

    this.adminUsers.toggleStatut(u.id).subscribe({
      next: (res) => {
        u.statut = res.user.statut;
        this.message = `Compte de ${u.prenom} ${u.nom} passé au statut ${u.statut}.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la modification du statut.';
        this.cdr.detectChanges();
      }
    });
  }

  validerDoc(u: any, action?: string): void {
    this.message = '';
    this.error = '';

    this.adminUsers.validerDocument(u.id, action).subscribe({
      next: (res) => {
        u.est_verifie = res.user.est_verifie;
        u.verification = res.user.verification;
        if (res.user.document_identite) {
          u.document_identite = res.user.document_identite;
        }
        this.message = res.message || `Statut de vérification mis à jour pour ${u.prenom} ${u.nom}.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la validation.';
        this.cdr.detectChanges();
      }
    });
  }

  voirDocument(u: any): void {
    this.message = '';
    this.error = '';
    this.adminUsers.getDocument(u.id).subscribe({
      next: (blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        window.open(fileUrl, '_blank');
      },
      error: (err) => {
        this.error = err.error?.message || 'Impossible d\'ouvrir la pièce d\'identité.';
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
