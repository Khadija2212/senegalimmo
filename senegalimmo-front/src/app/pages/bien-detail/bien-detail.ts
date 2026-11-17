import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { BienService } from '../../services/bien';
import { VisiteService } from '../../services/visite';
import { DemandeLocationService } from '../../services/demande-location';
import { OffreAchatService } from '../../services/offre-achat';
import { FavoriService } from '../../services/favori';
import { ComparateurService } from '../../services/comparateur';
import { SignalementService } from '../../services/signalement';
import { MapboxMapComponent } from '../../components/mapbox-map/mapbox-map';

@Component({
  selector: 'app-bien-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatSnackBarModule,
    MapboxMapComponent,
  ],
  templateUrl: './bien-detail.html',
  styleUrl: './bien-detail.css'
})
export class BienDetail implements OnInit {
  bien: any = null;
  isLoading = true;
  notFound = false;

  current = 0;
  lightbox = false;
  soon = false;

  // Favoris & Comparateur
  isFav = false;
  isComp = false;

  // Signalement
  showReportModal = false;
  isSendingReport = false;
  reportForm: FormGroup;

  // Demande de visite
  showVisitForm = false;
  visitSent = false;
  isSending = false;
  visitForm: FormGroup;
  minDate = '';

  // Demande de location
  showDemandeForm = false;
  demandeSent = false;
  isSendingDemande = false;
  demandeForm: FormGroup;
  minDay = '';

  // Offre d'achat
  showOfferForm = false;
  offerSent = false;
  isSendingOffer = false;
  offerForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private bienService: BienService,
    private visiteService: VisiteService,
    private demandeService: DemandeLocationService,
    private offreService: OffreAchatService,
    private favoriService: FavoriService,
    private comparateurService: ComparateurService,
    private signalementService: SignalementService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.visitForm = this.fb.group({
      date_visite: ['', Validators.required],
      commentaire: [''],
    });

    this.demandeForm = this.fb.group({
      date_emmenagement: [''],
      message: [''],
    });

    this.offerForm = this.fb.group({
      montant: [null, [Validators.required, Validators.min(1)]],
      message: [''],
    });

    this.reportForm = this.fb.group({
      motif: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit() {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    this.minDate = d.toISOString().slice(0, 16);
    this.minDay = new Date().toISOString().slice(0, 10);

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notFound = true;
      this.isLoading = false;
      return;
    }

    this.bienService.getOnePublic(id).subscribe({
      next: (b: any) => {
        this.bien = b;
        this.isLoading = false;
        this.checkFavoriStatus();
        this.checkCompareStatus();
        this.cdr.detectChanges();
      },
      error: () => {
        this.notFound = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.authService.getCurrentUser()?.role);
  }

  get photos(): string[] {
    return this.bien?.photos_urls ?? [];
  }

  get bienLatitude(): number | null {
    const val = this.bien?.latitude;
    return val !== null && val !== undefined && String(val).trim() !== '' ? Number(val) : null;
  }

  get bienLongitude(): number | null {
    const val = this.bien?.longitude;
    return val !== null && val !== undefined && String(val).trim() !== '' ? Number(val) : null;
  }

  get userRole(): string | null {
    return this.authService.getCurrentUser()?.role ?? null;
  }

  get canRequestVisit(): boolean {
    return this.userRole === 'client';
  }

  get canRequestRental(): boolean {
    return this.userRole === 'client' && this.bien?.transaction === 'location';
  }

  get canMakeOffer(): boolean {
    return this.userRole === 'client' && this.bien?.transaction === 'vente';
  }

  checkFavoriStatus(): void {
    if (this.isLoggedIn && this.bien) {
      this.favoriService.getFavorisIds().subscribe({
        next: (ids) => {
          this.isFav = ids.includes(this.bien.id);
          this.cdr.detectChanges();
        }
      });
    }
  }

  checkCompareStatus(): void {
    if (this.bien) {
      this.isComp = this.comparateurService.isInComparison(this.bien.id);
    }
  }

  toggleFavori(): void {
    if (!this.isLoggedIn) {
      this.snackBar.open('Veuillez vous connecter pour ajouter aux favoris.', 'Fermer', { duration: 3000 });
      return;
    }

    this.favoriService.toggle(this.bien.id).subscribe({
      next: (res) => {
        this.isFav = res.est_favori;
        this.snackBar.open(res.message, 'Fermer', { duration: 2500 });
        this.cdr.detectChanges();
      }
    });
  }

  toggleCompare(): void {
    const res = this.comparateurService.toggle(this.bien);
    this.isComp = res.added;
    this.snackBar.open(res.message, 'Fermer', { duration: 2500 });
    this.cdr.detectChanges();
  }

  openReportModal(): void {
    if (!this.isLoggedIn) {
      this.snackBar.open('Veuillez vous connecter pour signaler une annonce.', 'Fermer', { duration: 3000 });
      return;
    }
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportForm.reset();
  }

  submitReport(): void {
    if (this.reportForm.invalid || !this.bien) return;

    this.isSendingReport = true;
    this.signalementService.signaler({
      bien_id: this.bien.id,
      motif: this.reportForm.value.motif,
      description: this.reportForm.value.description
    }).subscribe({
      next: (res) => {
        this.isSendingReport = false;
        this.showReportModal = false;
        this.snackBar.open(res.message, 'Fermer', { duration: 4000 });
        this.reportForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSendingReport = false;
        this.snackBar.open(this.errorMessage(err, 'Erreur lors du signalement.'), 'Fermer', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  select(i: number) {
    this.current = i;
  }

  prev() {
    this.current = (this.current - 1 + this.photos.length) % this.photos.length;
  }

  next() {
    this.current = (this.current + 1) % this.photos.length;
  }

  openLightbox() {
    if (this.photos.length) this.lightbox = true;
  }

  closeLightbox() {
    this.lightbox = false;
  }

  openVisitForm() {
    this.showVisitForm = true;
    this.showDemandeForm = false;
    this.showOfferForm = false;
  }

  openDemandeForm() {
    this.showDemandeForm = true;
    this.showVisitForm = false;
    this.showOfferForm = false;
  }

  openOfferForm() {
    this.showOfferForm = true;
    this.showVisitForm = false;
    this.showDemandeForm = false;
  }

  submitVisit() {
    if (this.visitForm.invalid || !this.bien) return;

    this.isSending = true;
    const payload = {
      bien_id: this.bien.id,
      date_visite: this.visitForm.value.date_visite,
      commentaire: this.visitForm.value.commentaire || null,
    };

    this.visiteService.create(payload).subscribe({
      next: () => {
        this.isSending = false;
        this.visitSent = true;
        this.showVisitForm = false;
        this.visitForm.reset({ date_visite: '', commentaire: '' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSending = false;
        this.snackBar.open(this.errorMessage(err, 'Impossible d\'envoyer la demande'), 'Fermer', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }

  submitDemande() {
    if (!this.bien) return;

    this.isSendingDemande = true;
    const payload = {
      bien_id: this.bien.id,
      date_emmenagement: this.demandeForm.value.date_emmenagement || null,
      message: this.demandeForm.value.message || null,
    };

    this.demandeService.create(payload).subscribe({
      next: () => {
        this.isSendingDemande = false;
        this.demandeSent = true;
        this.showDemandeForm = false;
        this.demandeForm.reset({ date_emmenagement: '', message: '' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSendingDemande = false;
        this.snackBar.open(this.errorMessage(err, 'Impossible d\'envoyer la demande'), 'Fermer', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }

  submitOffer() {
    if (this.offerForm.invalid || !this.bien) return;

    this.isSendingOffer = true;
    const payload = {
      bien_id: this.bien.id,
      montant: Number(this.offerForm.value.montant),
      message: this.offerForm.value.message || null,
    };

    this.offreService.create(payload).subscribe({
      next: () => {
        this.isSendingOffer = false;
        this.offerSent = true;
        this.showOfferForm = false;
        this.offerForm.reset({ montant: null, message: '' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSendingOffer = false;
        this.snackBar.open(this.errorMessage(err, 'Impossible d\'envoyer l\'offre'), 'Fermer', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }

  private errorMessage(err: any, fallback: string): string {
    return err?.error?.message || fallback;
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.prev();
    if (event.key === 'Escape') {
      this.closeLightbox();
      this.closeReportModal();
    }
  }
}
