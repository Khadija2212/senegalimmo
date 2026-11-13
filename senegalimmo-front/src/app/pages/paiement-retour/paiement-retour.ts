import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PaiementService } from '../../services/paiement';

@Component({
  selector: 'app-paiement-retour',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  templateUrl: './paiement-retour.html',
  styleUrl: './paiement-retour.css'
})
export class PaiementRetour implements OnInit, OnDestroy {
  paiement: any = null;
  annule = false;
  introuvable = false;
  tentatives = 0;
  private timer: any;

  constructor(
    private route: ActivatedRoute,
    private paiementService: PaiementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const ref = this.route.snapshot.queryParamMap.get('ref');
    this.annule = this.route.snapshot.queryParamMap.get('annule') === '1';

    if (!ref) {
      this.introuvable = true;
      return;
    }

    this.check(ref);
    this.timer = setInterval(() => this.check(ref), 3000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  private check(ref: string) {
    this.tentatives++;

    this.paiementService.getByReference(ref).subscribe({
      next: (p) => {
        this.paiement = p;

        // Secours si l'IPN n'est pas arrivé : on interroge PayTech une fois
        if (p.statut === 'en_attente' && this.tentatives === 3 && !this.annule) {
          this.paiementService.verifier(p.id).subscribe({
            next: (maj) => {
              this.paiement = maj;
              this.cdr.detectChanges();
            },
            error: () => {}
          });
        }

        if (p.statut !== 'en_attente' || this.tentatives >= 10) {
          clearInterval(this.timer);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.introuvable = true;
        clearInterval(this.timer);
        this.cdr.detectChanges();
      }
    });
  }

  openQuittance() {
    this.paiementService.quittance(this.paiement.id).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        const win = window.open(fileURL, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          const a = document.createElement('a');
          a.href = fileURL;
          a.download = `recu-${this.paiement.reference}.pdf`;
          a.click();
        }
      },
      error: () => {}
    });
  }
}