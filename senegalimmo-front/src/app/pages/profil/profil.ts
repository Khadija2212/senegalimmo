import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { ProfilService } from '../../services/profil';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class Profil implements OnInit {
  user: any = null;
  isLoading = true;
  form: any = {};
  mdp = { mot_de_passe_actuel: '', password: '', password_confirmation: '' };
  saving = false;
  savingPwd = false;
  uploading = false;

  constructor(
    private profilService: ProfilService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      client: 'Client (Locataire & Acquéreur)', proprietaire: 'Propriétaire', locataire: 'Locataire', acheteur: 'Acheteur',
      agence: 'Agent immobilier', agent: 'Agent immobilier', administrateur: 'Administrateur',
    };
    return labels[role] ?? role;
  }

  verificationLabel(v: string): string {
    const labels: Record<string, string> = {
      non_soumis: 'Aucun document envoyé',
      en_attente: 'En attente de vérification',
      verifie: 'Identité vérifiée',
      refuse: 'Document refusé',
    };
    return labels[v] ?? v;
  }

  private message(err: any, fallback: string): string {
    return err.error?.errors
      ? (Object.values(err.error.errors).flat() as string[]).join(' ')
      : err.error?.message || fallback;
  }

  load() {
    this.profilService.get().subscribe({
      next: (u) => {
        this.user = u;
        this.form = {
          prenom: u.prenom, nom: u.nom, email: u.email, telephone: u.telephone, adresse: u.adresse ?? '',
          numero_cni: u.numero_cni ?? '',
          profession: u.profession ?? '', revenu_mensuel: u.revenu_mensuel ?? '',
          budget_min: u.budget_min ?? '', budget_max: u.budget_max ?? '',
          nom_agence: u.nom_agence ?? '', numero_licence: u.numero_licence ?? '',
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger le profil', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  save() {
    this.saving = true;

    this.profilService.update(this.form).subscribe({
      next: (res) => {
        this.saving = false;
        this.authService.updateStoredUser(res.user);
        this.snackBar.open('Profil enregistré', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(this.message(err, 'Enregistrement impossible'), 'Fermer', { duration: 6000 });
        this.cdr.detectChanges();
      }
    });
  }

  changePassword() {
    this.savingPwd = true;

    this.profilService.changerMotDePasse(this.mdp).subscribe({
      next: () => {
        this.savingPwd = false;
        this.mdp = { mot_de_passe_actuel: '', password: '', password_confirmation: '' };
        this.snackBar.open('Mot de passe modifié', 'Fermer', { duration: 4000 });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingPwd = false;
        this.snackBar.open(this.message(err, 'Modification impossible'), 'Fermer', { duration: 6000 });
        this.cdr.detectChanges();
      }
    });
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Le document dépasse 5 Mo', 'Fermer', { duration: 3000 });
      return;
    }

    this.uploading = true;
    this.profilService.envoyerDocument(file).subscribe({
      next: () => {
        this.uploading = false;
        this.snackBar.open('Document envoyé. Un administrateur va le vérifier.', 'Fermer', { duration: 5000 });
        this.load();
      },
      error: (err) => {
        this.uploading = false;
        this.snackBar.open(this.message(err, 'Envoi impossible'), 'Fermer', { duration: 6000 });
        this.cdr.detectChanges();
      }
    });
  }

  voirDocument() {
    this.profilService.voirDocument().subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.snackBar.open('Document introuvable', 'Fermer', { duration: 3000 })
    });
  }
}