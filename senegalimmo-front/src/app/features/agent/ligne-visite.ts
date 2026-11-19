import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { CLASSE_LIGNE, COULEURS } from './agent-vue';
import { FormulaireCompteRendu, SaisieCompteRendu } from './formulaire-compte-rendu';
import { ReprogrammerAgent } from './reprogrammer-agent';
import { SaisieMotif } from './saisie-motif';
import { LIENS_AGENT, TEXTES_AGENT } from './textes';
import { LigneVisite as Ligne } from './visites-vue';

type Volet = 'refuser' | 'reprogrammer' | 'rediger' | null;

/** Une visite d'un bien géré, en registre : client, créneau, état, réponse de l'agent. */
@Component({
  selector: 'si-ligne-visite',
  imports: [RouterLink, NgIcon, HlmButton, SaisieMotif, ReprogrammerAgent, FormulaireCompteRendu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ligne-visite.html',
  styleUrl: '../../shared/espace/lien-texte.css',
  host: { class: CLASSE_LIGNE },
})
export class LigneVisite {
  readonly ligne = input.required<Ligne>();
  /** Une seule action en bouton plein par bloc : la première ligne qui en a une. */
  readonly principale = input(false);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly confirmer = output<void>();
  readonly refuser = output<string>();
  readonly reprogrammer = output<string>();
  readonly rediger = output<SaisieCompteRendu>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly liens = LIENS_AGENT;
  /** Volet ouvert ; il se referme quand la ligne est rechargée après une action réussie. */
  protected readonly volet = linkedSignal<Ligne, Volet>({
    source: this.ligne,
    computation: () => null,
  });
  protected readonly couleur = computed(() => COULEURS[this.ligne().etat.ton]);
  protected readonly lienAnnonce = computed(() => [this.liens.annonce, this.ligne().annonce.id]);

  protected ouvrir(v: Volet): void {
    this.volet.update((actuel) => (actuel === v ? null : v));
  }
}
