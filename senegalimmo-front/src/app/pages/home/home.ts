import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth';
import { BienService } from '../../services/bien';
import { FavoriService } from '../../services/favori';
import { ComparateurService } from '../../services/comparateur';
import { MapboxService } from '../../services/mapbox.service';
import { MapboxMapComponent } from '../../components/mapbox-map/mapbox-map';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MapboxMapComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  biens: any[] = [];
  favorisIds: number[] = [];
  comparedBiens: any[] = [];
  isLoading = false;
  searchForm: FormGroup;
  transaction = '';
  viewMode: 'grid' | 'map' = 'grid';
  userPosition: { latitude: number; longitude: number } | null = null;
  rayonKm = 10;
  isLocating = false;
  geoError = '';

  types = [
    { value: '', label: 'Tous les types' },
    { value: 'appartement', label: 'Appartement' },
    { value: 'villa', label: 'Villa' },
    { value: 'studio', label: 'Studio' },
    { value: 'bureau', label: 'Bureau' },
  ];

  tabs = [
    { value: '', label: 'Tous' },
    { value: 'location', label: 'Location' },
    { value: 'vente', label: 'Vente' },
  ];

  constructor(
    private fb: FormBuilder,
    private bienService: BienService,
    private authService: AuthService,
    private favoriService: FavoriService,
    private comparateurService: ComparateurService,
    private mapboxService: MapboxService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.searchForm = this.fb.group({
      q: [''],
      type: [''],
      prix_min: [null],
      prix_max: [null],
    });
  }

  ngOnInit() {
    this.search();
    if (this.isLoggedIn) {
      this.favoriService.getFavorisIds().subscribe({
        next: (ids) => {
          this.favorisIds = (ids ?? []).map(id => Number(id));
          this.cdr.detectChanges();
        }
      });
    }

    this.comparateurService.biens$.subscribe((list) => {
      this.comparedBiens = list;
      this.cdr.detectChanges();
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.authService.getCurrentUser()?.role);
  }

  setTransaction(value: string) {
    this.transaction = value;
    this.search();
  }

  search() {
    this.isLoading = true;
    const filters: Record<string, any> = {
      ...this.searchForm.value,
      transaction: this.transaction,
    };

    if (this.userPosition) {
      filters['lat'] = this.userPosition.latitude;
      filters['lng'] = this.userPosition.longitude;
      filters['rayon_km'] = this.rayonKm;
    }

    this.bienService.getPublic(filters).subscribe({
      next: (data) => {
        this.biens = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.biens = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  reset() {
    this.searchForm.reset({ q: '', type: '', prix_min: null, prix_max: null });
    this.transaction = '';
    this.userPosition = null;
    this.geoError = '';
    this.search();
  }

  get geolocatedCount(): number {
    return this.biens.filter(
      (b) =>
        b?.latitude !== null &&
        b?.latitude !== undefined &&
        b?.longitude !== null &&
        b?.longitude !== undefined &&
        String(b.latitude).trim() !== '' &&
        String(b.longitude).trim() !== ''
    ).length;
  }

  setViewMode(mode: 'grid' | 'map') {
    this.viewMode = mode;
  }

  async locateMe() {
    this.isLocating = true;
    this.geoError = '';
    try {
      this.userPosition = await this.mapboxService.getBrowserPosition();
      this.viewMode = 'map';
      this.search();
    } catch (err: any) {
      this.geoError = err?.message || 'Géolocalisation indisponible.';
    } finally {
      this.isLocating = false;
      this.cdr.detectChanges();
    }
  }

  clearLocation() {
    this.userPosition = null;
    this.geoError = '';
    this.search();
  }

  onRadiusChange(value: string) {
    this.rayonKm = Number(value) || 10;
    if (this.userPosition) {
      this.search();
    }
  }

  openBien(id: number) {
    this.router.navigate(['/biens', id]);
  }

  isFavori(bienId: number): boolean {
    return this.favorisIds.includes(Number(bienId));
  }

  toggleFavori(event: Event, bien: any): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    const bienId = Number(bien.id);
    this.favoriService.toggle(bienId).subscribe({
      next: (res) => {
        if (res.est_favori) {
          if (!this.favorisIds.includes(bienId)) {
            this.favorisIds = [...this.favorisIds, bienId];
          }
        } else {
          this.favorisIds = this.favorisIds.filter(id => id !== bienId);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err?.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  isCompared(bienId: number): boolean {
    return this.comparateurService.isInComparison(bienId);
  }

  toggleCompare(event: Event, bien: any): void {
    event.stopPropagation();
    const res = this.comparateurService.toggle(bien);
    if (!res.added && res.message.includes('que 3 biens')) {
      alert(res.message);
    }
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }
}
