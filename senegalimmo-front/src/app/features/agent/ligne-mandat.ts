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
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { CLASSE_LIGNE, COULEURS } from './agent-vue';
import { LigneMandat as Ligne } from './registres-vue';
import { SaisieMotif } from './saisie-motif';
import { LIENS_AGENT, TEXTES_AGENT } from './textes';

type Volet = 'renouveler' | 'resilier' | null;

const DUREE_DEFAUT_MOIS = 12;
const DUREE_MAX_MOIS = 60;

/** Cas « Gérer les mandats », étendu par « Renouveler mandat » et « Résilier mandat ». */
@Component({
  selector: 'si-ligne-mandat',
  imports: [RouterLink, NgIcon, HlmButton, HlmInput, HlmLabel, SaisieMotif],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ligne-mandat.html',
  styleUrl: '../../shared/espace/lien-texte.css',
  host: { class: CLASSE_LIGNE },
})
export class LigneMandat {
  readonly ligne = input.required<Ligne>();
  readonly principale = input(false);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly renouveler = output<number>();
  readonly resilier = output<string>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly liens = LIENS_AGENT;
  protected readonly dureeMax = DUREE_MAX_MOIS;
  protected readonly volet = linkedSignal<Ligne, Volet>({
    source: this.ligne,
    computation: () => null,
  });
  protected readonly duree = signal(DUREE_DEFAUT_MOIS);
  protected readonly dureeValide = computed(() => {
    const d = this.duree();
    return Number.isInteger(d) && d >= 1 && d <= DUREE_MAX_MOIS;
  });
  protected readonly couleur = computed(() => COULEURS[this.ligne().etat.ton]);

  protected ouvrir(v: Volet): void {
    this.volet.update((actuel) => (actuel === v ? null : v));
  }
}
