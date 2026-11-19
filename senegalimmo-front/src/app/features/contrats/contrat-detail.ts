import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { Contrat } from '../../core/modeles/contrats';
import { ContratsService, ouvrirDocument } from '../../core/services/contrats';
import { messageErreur } from '../../core/services/demarches';
import { SessionService } from '../../core/session/session';
import { BlocBail } from './bloc-bail';
import { BlocPromesse } from './bloc-promesse';
import { BlocSignatures } from './bloc-signatures';
import { etatContrat, libelleNature, taux } from './contrats-vue';
import { COULEUR_TON, jour } from './etat';
import { EtatsDesLieux } from './etats-des-lieux';
import { LIENS_CONTRATS, TEXTES_CONTRATS } from './textes';
import { lire } from '../../core/ressources/lire';

const INTROUVABLE = [403, 404];

/** Un contrat : en-tête, signatures, puis ce qui est propre au bail, à la promesse ou au mandat. */
@Component({
  selector: 'si-contrat-detail',
  imports: [RouterLink, HlmButton, BlocSignatures, BlocBail, BlocPromesse, EtatsDesLieux],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contrat-detail.html',
  styleUrl: '../../shared/espace/lien-texte.css',
  host: { class: 'block' },
})
export class ContratDetail {
  protected readonly lire = lire;
  /** Paramètre de route « :id ». */
  readonly id = input.required<string>();

  protected readonly textes = TEXTES_CONTRATS;
  protected readonly cheminContrats = LIENS_CONTRATS.contrats;
  private readonly session = inject(SessionService);
  private readonly service = inject(ContratsService);

  protected readonly role = this.session.role;
  protected readonly compteId = computed(() => this.session.compte()?.id ?? '');
  protected readonly contrat = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.service.detail(params),
  });
  protected readonly introuvable = computed(() => {
    const e = this.contrat.error();
    const http = e instanceof HttpErrorResponse ? e : e?.cause;
    return http instanceof HttpErrorResponse && INTROUVABLE.includes(http.status);
  });
  protected readonly nature = computed(() => {
    const c = lire(this.contrat);
    return c ? libelleNature(c.nature) : '';
  });
  protected readonly etat = computed(() => {
    const c = lire(this.contrat);
    return c ? etatContrat(c) : null;
  });
  protected readonly couleur = computed(() => {
    const e = this.etat();
    return e ? COULEUR_TON[e.ton] : '';
  });
  protected readonly mandat = computed((): readonly (readonly [string, string])[] => {
    const c = lire(this.contrat);
    if (c?.nature !== 'mandat') return [];
    return [
      [
        this.textes.typeMandat,
        c.type === 'exclusif' ? this.textes.mandatExclusif : this.textes.mandatSimple,
      ],
      [this.textes.tauxCommission, this.textes.taux(taux(c.taux_commission))],
      [this.textes.debut, c.date_debut ? jour(c.date_debut) : ''],
      [this.textes.fin, jour(c.date_fin)],
    ];
  });

  protected readonly ouverture = signal(false);
  protected readonly erreurPdf = signal<string | null>(null);

  protected telecharger(): void {
    this.ouverture.set(true);
    this.erreurPdf.set(null);
    ouvrirDocument(this.service.document(this.id())).subscribe({
      next: () => this.ouverture.set(false),
      error: (e: unknown) => {
        this.ouverture.set(false);
        this.erreurPdf.set(messageErreur(e, this.textes.erreurAction));
      },
    });
  }

  protected signe(c: Contrat): void {
    this.contrat.set(c);
  }
}
