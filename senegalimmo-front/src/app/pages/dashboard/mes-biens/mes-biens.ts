import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth';
import { BienService } from '../../../services/bien';
import { AnnonceService } from '../../../services/annonce';
import { MapboxService } from '../../../services/mapbox.service';
import { MapboxMapComponent } from '../../../components/mapbox-map/mapbox-map';

@Component({
  selector: 'app-mes-biens',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MapboxMapComponent,
  ],
  templateUrl: './mes-biens.html',
  styleUrl: './mes-biens.css'
})
export class MesBiens implements OnInit {
  biens: any[] = [];
  user: any;
  showForm = false;
  isLoading = false;
  editingId: number | null = null;
  editingBien: any = null;
  uploading = false;
  bienForm: FormGroup;
  isAnnoncesPage = false;
  filtreAnnonce: string = 'tous';

  selectedFiles: File[] = [];
  previews: string[] = [];
  readonly maxPhotos = 5;

  types = [
    { value: 'appartement', label: 'Appartement' },
    { value: 'villa', label: 'Villa' },
    { value: 'studio', label: 'Studio' },
    { value: 'bureau', label: 'Bureau' },
  ];

  transactions = [
    { value: 'location', label: 'Location' },
    { value: 'vente', label: 'Vente' },
  ];

  constructor(
    private fb: FormBuilder,
    private bienService: BienService,
    private authService: AuthService,
    private annonceService: AnnonceService,
    private mapboxService: MapboxService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();
    this.bienForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      type: ['', Validators.required],
      transaction: ['', Validators.required],
      prix: [null, [Validators.required, Validators.min(0)]],
      surface: [null],
      chambres: [null],
      salles_bain: [null],
      adresse: ['', Validators.required],
      quartier: ['', Validators.required],
      ville: ['Dakar', Validators.required],
      latitude: [null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.min(-180), Validators.max(180)]],
    });
  }

  ngOnInit() {
    this.route.url.subscribe(segments => {
      const fullPath = segments.map(s => s.path).join('/');
      if (fullPath.includes('annonces')) {
        this.isAnnoncesPage = true;
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['filtre']) {
        this.filtreAnnonce = params['filtre'];
      }
    });

    this.loadBiens();
  }

  get biensAffiches(): any[] {
    if (!this.filtreAnnonce || this.filtreAnnonce === 'tous') {
      return this.biens;
    }
    if (this.filtreAnnonce === 'non_publiee') {
      return this.biens.filter(b => !this.annonceStatut(b));
    }
    return this.biens.filter(b => this.annonceStatut(b) === this.filtreAnnonce);
  }

  get countPubliees(): number {
    return this.biens.filter(b => this.annonceStatut(b) === 'publiee').length;
  }

  get countEnAttente(): number {
    return this.biens.filter(b => this.annonceStatut(b) === 'en_attente').length;
  }

  get countRejetees(): number {
    return this.biens.filter(b => this.annonceStatut(b) === 'rejetee').length;
  }

  get countNonPubliees(): number {
    return this.biens.filter(b => !this.annonceStatut(b)).length;
  }

  setFiltre(filtre: string) {
    this.filtreAnnonce = filtre;
  }

  loadBiens() {
    this.bienService.getAll().subscribe({
      next: (data) => {
        this.biens = data;
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Impossible de charger les biens', 'Fermer', { duration: 3000 })
    });
  }

  /* ---------- Formulaire : création / modification ---------- */

  toggleForm() {
    if (this.showForm) {
      this.closeForm();
    } else {
      this.editingId = null;
      this.editingBien = null;
      this.bienForm.reset({ ville: 'Dakar', latitude: null, longitude: null });
      this.showForm = true;
    }
  }

  startEdit(bien: any) {
    this.editingId = bien.id;
    this.editingBien = bien;
    this.resetPhotos();
    this.bienForm.reset({
      titre: bien.titre,
      description: bien.description,
      type: bien.type,
      transaction: bien.transaction,
      prix: Number(bien.prix),
      surface: bien.surface ? Number(bien.surface) : null,
      chambres: bien.chambres,
      salles_bain: bien.salles_bain,
      adresse: bien.adresse,
      quartier: bien.quartier,
      ville: bien.ville,
      latitude: bien.latitude !== null && bien.latitude !== undefined ? Number(bien.latitude) : null,
      longitude: bien.longitude !== null && bien.longitude !== undefined ? Number(bien.longitude) : null,
    });
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.editingBien = null;
    this.bienForm.reset({ ville: 'Dakar', latitude: null, longitude: null });
    this.resetPhotos();
  }

  /* ---------- Géolocalisation Mapbox ---------- */

  isLocating = false;

  onCoordinatesChange(coords: { latitude: number; longitude: number }) {
    this.bienForm.patchValue({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  }

  async locateFromAddress() {
    const { adresse, quartier, ville } = this.bienForm.value;
    const query = [adresse, quartier, ville].filter(Boolean).join(', ');
    if (!query.trim()) {
      this.snackBar.open('Renseignez au moins le quartier ou la ville avant de rechercher.', 'Fermer', { duration: 3000 });
      return;
    }

    if (!this.mapboxService.hasToken()) {
      this.snackBar.open('Configurez d’abord votre token Mapbox sur la carte ci-dessous.', 'Fermer', { duration: 3500 });
      return;
    }

    this.isLocating = true;
    try {
      const results = await this.mapboxService.geocodeAddress(query);
      if (!results.length) {
        this.snackBar.open('Aucun lieu trouvé. Cliquez directement sur la carte pour placer le bien.', 'Fermer', { duration: 4000 });
      } else {
        this.bienForm.patchValue({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        });
        this.snackBar.open(`Position trouvée : ${results[0].placeName}`, 'Fermer', { duration: 3000 });
      }
    } catch {
      this.snackBar.open('Erreur lors du géocodage Mapbox.', 'Fermer', { duration: 3500 });
    } finally {
      this.isLocating = false;
      this.cdr.detectChanges();
    }
  }

  async useMyLocation() {
    this.isLocating = true;
    try {
      const pos = await this.mapboxService.getBrowserPosition();
      this.bienForm.patchValue({
        latitude: pos.latitude,
        longitude: pos.longitude,
      });

      if (this.mapboxService.hasToken() && (!this.bienForm.value.adresse || !this.bienForm.value.quartier)) {
        const reverse = await this.mapboxService.reverseGeocode(pos.longitude, pos.latitude);
        if (reverse) {
          this.bienForm.patchValue({
            adresse: this.bienForm.value.adresse || reverse.adresse,
            quartier: this.bienForm.value.quartier || reverse.quartier,
            ville: this.bienForm.value.ville || reverse.ville,
          });
        }
      }
      this.snackBar.open('Position GPS récupérée.', 'Fermer', { duration: 2500 });
    } catch (err: any) {
      this.snackBar.open(err?.message || 'Géolocalisation impossible.', 'Fermer', { duration: 3500 });
    } finally {
      this.isLocating = false;
      this.cdr.detectChanges();
    }
  }

  clearCoordinates() {
    this.bienForm.patchValue({ latitude: null, longitude: null });
  }

  /* ---------- Photos : création ---------- */

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    for (const file of files) {
      if (this.selectedFiles.length >= this.maxPhotos) {
        this.snackBar.open(`Maximum ${this.maxPhotos} photos`, 'Fermer', { duration: 3000 });
        break;
      }
      if (file.size > 4 * 1024 * 1024) {
        this.snackBar.open(`« ${file.name} » dépasse 4 Mo`, 'Fermer', { duration: 3000 });
        continue;
      }
      this.selectedFiles.push(file);
      this.previews.push(URL.createObjectURL(file));
    }

    input.value = '';
  }

  removeFile(index: number) {
    URL.revokeObjectURL(this.previews[index]);
    this.selectedFiles.splice(index, 1);
    this.previews.splice(index, 1);
  }

  private resetPhotos() {
    this.previews.forEach((url) => URL.revokeObjectURL(url));
    this.selectedFiles = [];
    this.previews = [];
  }

  /* ---------- Photos : modification d'un bien existant ---------- */

  addPhotosToBien(event: Event) {
    if (!this.editingBien) return;

    const input = event.target as HTMLInputElement;
    const restant = this.maxPhotos - (this.editingBien.photos?.length ?? 0);

    const valides = Array.from(input.files ?? [])
      .filter((f) => {
        if (f.size > 4 * 1024 * 1024) {
          this.snackBar.open(`« ${f.name} » dépasse 4 Mo`, 'Fermer', { duration: 3000 });
          return false;
        }
        return true;
      })
      .slice(0, restant);

    input.value = '';
    if (!valides.length) return;

    const formData = new FormData();
    valides.forEach((f) => formData.append('photos[]', f));

    this.uploading = true;
    this.bienService.addPhotos(this.editingBien.id, formData).subscribe({
      next: (bien) => {
        this.editingBien = bien;
        this.uploading = false;
        this.snackBar.open('Photos ajoutées', 'Fermer', { duration: 3000 });
        this.loadBiens();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploading = false;
        this.onError(err, 'Ajout des photos impossible');
      }
    });
  }

  removeExistingPhoto(index: number) {
    const photo = this.editingBien?.photos?.[index];
    if (!photo || !confirm('Supprimer cette photo ?')) return;

    this.bienService.removePhoto(this.editingBien.id, photo).subscribe({
      next: (bien) => {
        this.editingBien = bien;
        this.snackBar.open('Photo supprimée', 'Fermer', { duration: 3000 });
        this.loadBiens();
        this.cdr.detectChanges();
      },
      error: (err) => this.onError(err, 'Suppression impossible')
    });
  }

  /* ---------- Enregistrement ---------- */

  onSubmit() {
    if (this.bienForm.invalid) return;
    this.isLoading = true;

    if (this.editingId) {
      this.bienService.update(this.editingId, this.bienForm.value).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Bien modifié avec succès !', 'Fermer', { duration: 3000 });
          this.closeForm();
          this.loadBiens();
        },
        error: (err) => this.onError(err, 'Erreur lors de la modification')
      });
      return;
    }

    const formData = new FormData();
    Object.entries(this.bienForm.value).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    this.selectedFiles.forEach((file) => formData.append('photos[]', file));

    this.bienService.create(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Bien ajouté avec succès !', 'Fermer', { duration: 3000 });
        this.closeForm();
        this.loadBiens();
      },
      error: (err) => this.onError(err, 'Erreur lors de l\'ajout')
    });
  }

  private onError(err: any, fallback: string) {
    this.isLoading = false;
    const message = err.error?.errors
      ? (Object.values(err.error.errors).flat() as string[]).join(' ')
      : err.error?.message || fallback;
    this.snackBar.open(message, 'Fermer', { duration: 5000 });
    this.cdr.detectChanges();
  }

  deleteBien(bien: any) {
    if (!confirm(`Supprimer « ${bien.titre} » ?`)) return;

    this.bienService.delete(bien.id).subscribe({
      next: () => {
        this.snackBar.open('Bien supprimé', 'Fermer', { duration: 3000 });
        this.loadBiens();
      },
      error: () => this.snackBar.open('Suppression impossible', 'Fermer', { duration: 3000 })
    });
  }

  /* ---------- Annonces ---------- */

  annonceStatut(bien: any): string {
    return bien.annonces?.[0]?.statut ?? '';
  }

  annonceMotif(bien: any): string {
    return bien.annonces?.[0]?.motif_rejet ?? '';
  }

  peutPublier(bien: any): boolean {
    const statut = this.annonceStatut(bien);
    return statut === '' || statut === 'rejetee' || statut === 'expiree';
  }

  publier(bien: any) {
    this.annonceService.publish(bien.id).subscribe({
      next: () => {
        this.snackBar.open('Annonce envoyée à l\'administrateur pour validation', 'Fermer', { duration: 4000 });
        this.loadBiens();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Publication impossible', 'Fermer', { duration: 4000 });
      }
    });
  }

  retirer(bien: any) {
    const annonce = bien.annonces?.[0];
    if (!annonce || !confirm('Retirer cette annonce ?')) return;

    this.annonceService.withdraw(annonce.id).subscribe({
      next: () => {
        this.snackBar.open('Annonce retirée', 'Fermer', { duration: 3000 });
        this.loadBiens();
      },
      error: () => this.snackBar.open('Action impossible', 'Fermer', { duration: 3000 })
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}