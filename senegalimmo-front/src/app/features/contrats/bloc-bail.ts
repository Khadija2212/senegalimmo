import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { fcfa } from '../../core/format/fcfa';
import { Bail } from '../../core/modeles/contrats';
import { ContratsService } from '../../core/services/contrats';
import { messageErreur } from '../../core/services/demarches';
import { Role } from '../../core/session/session';
import { paiementPropose } from './contrats-vue';
import { jour } from './etat';
import { LIENS_CONTRATS, TEXTES_CONTRATS } from './textes';

/** Conditions du bail, échéancier, paiement du locataire, résiliation par le propriétaire. */
@Component({
  selector: 'si-bloc-bail',
  imports: [RouterLink, HlmButton, HlmLabel, HlmTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bloc-bail.html',
  styleUrls: ['../../shared/espace/lien-texte.css', '../../shared/espace/confirmer.css'],
  host: { class: 'block' },
})
export class BlocBail {
  readonly bail = input.required<Bail>();
  readonly role = input.required<Role | null>();
  readonly resilie = output<void>();

  protected readonly textes = TEXTES_CONTRATS;
  protected readonly cheminPaiements = LIENS_CONTRATS.paiements;
  protected readonly jour = jour;
  private readonly service = inject(ContratsService);

  /** L'échéancier n'a de sens qu'une fois le bail signé. */
  protected readonly echeancier = rxResource({
    params: () => {
      const b = this.bail();
      return b.statut === 'signe' || b.statut === 'resilie' ? b.id : undefined;
    },
    stream: ({ params }) => this.service.echeancier(params),
  });
  protected readonly conditions = computed((): readonly (readonly [string, string])[] => {
    const b = this.bail();
    return [
      [this.textes.loyer, fcfa(b.loyer_mensuel)],
      [this.textes.charges, fcfa(b.charges)],
      [this.textes.caution, b.caution ? fcfa(b.caution) : this.textes.cautionSans],
      [this.textes.duree, this.textes.dureeMois(b.duree_mois)],
      [this.textes.debut, b.date_debut ? jour(b.date_debut) : ''],
      [this.textes.echeance, this.textes.echeanceJour(b.jour_echeance)],
    ];
  });
  protected readonly propose = computed(() => {
    const e = this.echeancier.value();
    const b = this.bail();
    return e && b.statut === 'signe' && this.role() === 'client' ? paiementPropose(b.id, e) : null;
  });
  protected readonly peutResilier = computed(
    () => this.role() === 'proprietaire' && this.bail().statut === 'signe',
  );

  protected readonly confirmation = signal(false);
  protected readonly motif = signal('');
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected basculer(): void {
    this.confirmation.update((v) => !v);
    this.erreur.set(null);
  }

  protected resilier(): void {
    const motif = this.motif().trim();
    if (!motif) {
      this.erreur.set(this.textes.motifRequis);
      return;
    }
    this.enCours.set(true);
    this.erreur.set(null);
    this.service.resilierBail(this.bail().id, motif).subscribe({
      next: () => {
        this.enCours.set(false);
        this.confirmation.set(false);
        this.resilie.emit();
      },
      error: (e: unknown) => {
        this.enCours.set(false);
        this.erreur.set(messageErreur(e, this.textes.erreurAction));
      },
    });
  }
}
