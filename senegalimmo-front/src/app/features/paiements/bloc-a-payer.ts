import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmRadioGroupImports } from '@spartan-ng/helm/radio-group';
import { fcfa } from '../../core/format/fcfa';
import { MethodePaiement } from '../../core/modeles/paiements';
import { messageErreur } from '../../core/services/demarches';
import { PaiementsService } from '../../core/services/paiements';
import { jour } from '../contrats/etat';
import { METHODES, SommeDue, demandePour, libelleMethode } from './paiements-vue';
import { TEXTES_PAIEMENTS } from './textes';

/** Choix de la somme due et du moyen de paiement, puis départ vers la page du prestataire. */
@Component({
  selector: 'si-bloc-a-payer',
  imports: [HlmButton, HlmLabel, HlmRadioGroupImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bloc-a-payer.html',
  host: { class: 'block' },
})
export class BlocAPayer {
  readonly dus = input.required<readonly SommeDue[]>();
  /** Somme désignée par l'adresse, ou la première due. */
  readonly preselection = input<string | null>(null);

  protected readonly textes = TEXTES_PAIEMENTS;
  protected readonly methodes = METHODES;
  protected readonly libelleMethode = libelleMethode;
  protected readonly fcfa = fcfa;
  protected readonly jour = jour;
  private readonly service = inject(PaiementsService);

  protected readonly choix = linkedSignal(() => this.preselection());
  protected readonly choisie = computed(
    () => this.dus().find((s) => s.cle === this.choix()) ?? null,
  );
  protected readonly methode = signal<MethodePaiement>(METHODES[0]);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected choisir(cle: unknown): void {
    const s = this.dus().find((x) => x.cle === cle);
    if (s) this.choix.set(s.cle);
  }

  protected choisirMethode(m: unknown): void {
    const trouvee = METHODES.find((x) => x === m);
    if (trouvee) this.methode.set(trouvee);
  }

  protected payer(): void {
    const s = this.choisie();
    if (!s) return;
    this.enCours.set(true);
    this.erreur.set(null);
    this.service.initier(demandePour(s, this.methode())).subscribe({
      next: (r) => window.location.assign(r.redirect_url),
      error: (e: unknown) => {
        this.enCours.set(false);
        this.erreur.set(messageErreur(e, this.textes.erreurAction));
      },
    });
  }
}
