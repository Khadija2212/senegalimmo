import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { fcfa } from '../../../core/format/fcfa';
import { FcfaPipe } from '../../../core/format/fcfa.pipe';
import { OptionPremium } from '../../../core/modeles/proprietaire';
import { ActionAnnonce } from '../../../core/services/proprietaire';
import { LIENS_PROPRIETAIRE, TEXTES_PROPRIETAIRE } from '../textes';
import { COULEURS_TON } from '../vue-commune';
import { LigneBien } from './biens-vue';

type Volet = 'suspendre' | 'conclure' | 'premium' | null;

/** Un bien et son annonce, en registre : photo, prix, état, vues et actions écrites. */
@Component({
  selector: 'si-ligne-bien',
  imports: [RouterLink, FcfaPipe, HlmToggleGroupImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ligne-bien.html',
  styleUrls: ['../../../shared/espace/lien-texte.css', '../../../shared/espace/confirmer.css'],
  host: {
    class:
      'grid grid-cols-[96px_minmax(0,1fr)] items-start gap-4 border-b border-border py-[18px] sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:gap-5',
  },
})
export class LigneBienComposant {
  readonly ligne = input.required<LigneBien>();
  readonly options = input<readonly OptionPremium[] | null>(null);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly agir = output<ActionAnnonce>();
  readonly mettreEnAvant = output<string>();

  protected readonly textes = TEXTES_PROPRIETAIRE;
  protected readonly liens = LIENS_PROPRIETAIRE;
  /** Volet ouvert ; il se referme quand le bien est rechargé après une action réussie. */
  protected readonly volet = linkedSignal<LigneBien, Volet>({
    source: this.ligne,
    computation: () => null,
  });
  protected readonly option = signal<string | null>(null);
  protected readonly couleur = computed(() => COULEURS_TON[this.ligne().etat.ton]);
  protected readonly optionChoisie = computed(
    () => this.options()?.find((o) => o.id === this.option()) ?? null,
  );
  protected readonly libelleOption = (o: OptionPremium): string =>
    this.textes.optionDetail(o.duree_jours, fcfa(o.prix));
  protected readonly prixActivation = computed(() => {
    const o = this.optionChoisie();
    return o ? this.textes.activer(fcfa(o.prix)) : '';
  });

  protected ouvrir(v: Volet): void {
    this.volet.update((actuel) => (actuel === v ? null : v));
  }

  protected choisirOption(valeur: unknown): void {
    this.option.set(typeof valeur === 'string' ? valeur : null);
  }

  protected activer(): void {
    const id = this.option();
    if (id) this.mettreEnAvant.emit(id);
  }
}
