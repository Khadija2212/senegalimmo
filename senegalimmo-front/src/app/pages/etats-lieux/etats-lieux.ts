import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { ContratService } from '../../services/contrat';
import { EtatLieuxService } from '../../services/etat-lieux';

interface Piece {
  piece: string;
  etat: string;
  remarque: string;
}

@Component({
  selector: 'app-etats-lieux',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './etats-lieux.html',
  styleUrl: './etats-lieux.css'
})
export class EtatsLieux implements OnInit {
  contratId = 0;
  contrat: any = null;
  etats: any[] = [];
  user: any;
  isLoading = true;

  formType: string | null = null;
  pieces: Piece[] = [];
  observations = '';
  files: File[] = [];
  previews: string[] = [];
  saving = false;
  remarques: Record<number, string> = {};
  readonly maxPhotos = 8;

  types = [
    { value: 'entree', label: 'État des lieux d\'entrée' },
    { value: 'sortie', label: 'État des lieux de sortie' },
  ];

  niveaux = [
    { value: 'bon', label: 'Bon état' },
    { value: 'moyen', label: 'État moyen' },
    { value: 'mauvais', label: 'Mauvais état' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private contratService: ContratService,
    private etatService: EtatLieuxService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.contratId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  get isOwner(): boolean {
    return this.user?.role === 'proprietaire';
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  niveauLabel(value: string): string {
    return this.niveaux.find((n) => n.value === value)?.label ?? value;
  }

  find(type: string): any {
    return this.etats.find((e) => e.type === type);
  }

  canCreate(type: string): boolean {
    if (!this.isOwner || this.find(type)) return false;
    if (type === 'sortie') return !!this.find('entree')?.valide_locataire;
    return true;
  }

  private message(err: any, fallback: string): string {
    return err.error?.errors
      ? (Object.values(err.error.errors).flat() as string[]).join(' ')
      : err.error?.message || fallback;
  }

  load() {
    this.contratService.getAll().subscribe({
      next: (contrats) => {
        this.contrat = contrats.find((c) => c.id === this.contratId) ?? null;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.etatService.list(this.contratId).subscribe({
      next: (data) => {
        this.etats = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les états des lieux', 'Fermer', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  /* ---------- Formulaire (propriétaire) ---------- */

  openForm(type: string) {
    this.formType = type;
    this.observations = '';
    this.pieces = ['Salon', 'Chambre', 'Cuisine', 'Salle de bain', 'Toilettes'].map((p) => ({
      piece: p,
      etat: 'bon',
      remarque: '',
    }));
    this.resetFiles();
  }

  closeForm() {
    this.formType = null;
    this.resetFiles();
  }

  addPiece() {
    this.pieces.push({ piece: '', etat: 'bon', remarque: '' });
  }

  removePiece(index: number) {
    this.pieces.splice(index, 1);
  }

  onFiles(event: Event) {
    const input = event.target as HTMLInputElement;

    for (const file of Array.from(input.files ?? [])) {
      if (this.files.length >= this.maxPhotos) {
        this.snackBar.open(`Maximum ${this.maxPhotos} photos`, 'Fermer', { duration: 3000 });
        break;
      }
      if (file.size > 4 * 1024 * 1024) {
        this.snackBar.open(`« ${file.name} » dépasse 4 Mo`, 'Fermer', { duration: 3000 });
        continue;
      }
      this.files.push(file);
      this.previews.push(URL.createObjectURL(file));
    }

    input.value = '';
  }

  removeFile(index: number) {
    URL.revokeObjectURL(this.previews[index]);
    this.files.splice(index, 1);
    this.previews.splice(index, 1);
  }

  private resetFiles() {
    this.previews.forEach((url) => URL.revokeObjectURL(url));
    this.files = [];
    this.previews = [];
  }

  submit() {
    const pieces = this.pieces.filter((p) => p.piece.trim() !== '');

    if (!this.formType || pieces.length === 0) {
      this.snackBar.open('Ajoutez au moins une pièce', 'Fermer', { duration: 3000 });
      return;
    }

    const formData = new FormData();
    formData.append('contrat_id', String(this.contratId));
    formData.append('type', this.formType);
    formData.append('pieces', JSON.stringify(pieces));
    if (this.observations.trim()) {
      formData.append('observations', this.observations.trim());
    }
    this.files.forEach((f) => formData.append('photos[]', f));

    this.saving = true;
    this.etatService.create(formData).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('État des lieux enregistré. Le locataire doit maintenant le valider.', 'Fermer', { duration: 5000 });
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(this.message(err, 'Enregistrement impossible'), 'Fermer', { duration: 6000 });
        this.cdr.detectChanges();
      }
    });
  }

  /* ---------- Validation (locataire) ---------- */

  validate(etat: any) {
    if (!confirm('Confirmez-vous que cet état des lieux correspond à la réalité ?')) return;

    this.etatService.validate(etat.id, this.remarques[etat.id] ?? '').subscribe({
      next: () => {
        this.snackBar.open('État des lieux validé', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Validation impossible'), 'Fermer', { duration: 4000 })
    });
  }
}