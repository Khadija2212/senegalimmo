import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import {
  Observable,
  catchError,
  concatMap,
  map,
  of,
  startWith,
  switchMap,
  take,
  takeWhile,
  timer,
} from 'rxjs';
import { fcfa } from '../../core/format/fcfa';
import { Paiement } from '../../core/modeles/paiements';
import { ouvrirDocument } from '../../core/services/contrats';
import { messageErreur } from '../../core/services/demarches';
import { PaiementsService } from '../../core/services/paiements';
import {
  PhaseRetour,
  libelleDocument,
  lienContrat,
  parametresRelance,
  peutTelecharger,
  phaseRetour,
} from './paiements-vue';
import { LIENS_PAIEMENTS, TEXTES_PAIEMENTS } from './textes';

/** La passerelle confirme par notification serveur : on relit toutes les 3 s, 30 s au plus. */
const INTERVALLE_MS = 3_000;
const DUREE_MAX_MS = 30_000;
const LECTURES = DUREE_MAX_MS / INTERVALLE_MS + 1;

type Phase = PhaseRetour | 'chargement' | 'erreur' | 'sans_reference';

interface Suivi {
  phase: Phase;
  paiement: Paiement | null;
}

const CHARGEMENT: Suivi = { phase: 'chargement', paiement: null };

/** Page de retour de la passerelle (paramètre « ref ») : réussi, en cours ou échoué. */
@Component({
  selector: 'si-retour-paiement',
  imports: [RouterLink, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './retour-paiement.html',
  styleUrl: '../../shared/espace/lien-texte.css',
  host: { class: 'block' },
})
export class RetourPaiement {
  /** Référence du paiement, ajoutée par le backend à l'adresse de retour. */
  readonly ref = input<string>('');

  protected readonly textes = TEXTES_PAIEMENTS;
  protected readonly cheminPaiements = LIENS_PAIEMENTS.paiements;
  private readonly service = inject(PaiementsService);
  /** Chaque « Vérifier à nouveau » relance une série de lectures. */
  private readonly essai = signal(0);

  protected readonly suivi = toSignal(
    toObservable(computed(() => ({ ref: this.ref(), essai: this.essai() }))).pipe(
      switchMap(({ ref }) =>
        ref ? this.suivre(ref) : of<Suivi>({ phase: 'sans_reference', paiement: null }),
      ),
    ),
    { initialValue: CHARGEMENT },
  );
  protected readonly paiement = computed(() => this.suivi().paiement);
  protected readonly montant = computed(() => {
    const p = this.paiement();
    return p ? fcfa(p.montant) : '';
  });
  protected readonly lienContrat = computed(() => {
    const p = this.paiement();
    return p ? lienContrat(p) : null;
  });
  protected readonly relance = computed(() => {
    const p = this.paiement();
    return p ? parametresRelance(p) : {};
  });
  protected readonly document = computed(() => {
    const p = this.paiement();
    return p && peutTelecharger(p) ? libelleDocument(p) : null;
  });

  protected readonly ouverture = signal(false);
  protected readonly erreurDocument = signal<string | null>(null);

  protected verifier(): void {
    this.essai.update((n) => n + 1);
  }

  protected telecharger(): void {
    const p = this.paiement();
    if (!p) return;
    this.ouverture.set(true);
    this.erreurDocument.set(null);
    ouvrirDocument(this.service.quittance(p.id)).subscribe({
      next: () => this.ouverture.set(false),
      error: (e: unknown) => {
        this.ouverture.set(false);
        this.erreurDocument.set(messageErreur(e, this.textes.erreurAction));
      },
    });
  }

  private suivre(ref: string): Observable<Suivi> {
    return timer(0, INTERVALLE_MS).pipe(
      take(LECTURES),
      concatMap((i) =>
        this.service
          .parReference(ref)
          .pipe(map((p): Suivi => ({ phase: phaseRetour(p, i === LECTURES - 1), paiement: p }))),
      ),
      takeWhile((s) => s.phase === 'en_cours', true),
      startWith(CHARGEMENT),
      catchError(() => of<Suivi>({ phase: 'erreur', paiement: null })),
    );
  }
}
