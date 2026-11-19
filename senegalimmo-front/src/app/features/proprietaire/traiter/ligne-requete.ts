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
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { NomIcone } from '../../../shared/icones/icones';
import { LIENS_PROPRIETAIRE, TEXTES_PROPRIETAIRE } from '../textes';
import { COULEURS_TON } from '../vue-commune';
import { GenreRequete, Requete } from './requetes-vue';

type Volet = 'refuser' | 'accepter' | null;

/** Longueur maximale du motif, comme la règle du contrôleur. */
const MOTIF_MAX = 1000;
const ICONES: Readonly<Record<GenreRequete, NomIcone>> = {
  visite: 'siCle',
  location: 'siContrat',
  offre: 'siContrat',
};

/** Une demande reçue, en registre : photo, détail, état en clair, réponse dans la ligne. */
@Component({
  selector: 'si-ligne-requete',
  imports: [RouterLink, NgIcon, HlmButton, HlmLabel, HlmTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ligne-requete.html',
  styleUrls: ['../../../shared/espace/lien-texte.css', '../../../shared/espace/confirmer.css'],
  host: {
    class:
      'grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3.5 border-b border-border py-[18px] sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:gap-[18px]',
  },
})
export class LigneRequete {
  readonly requete = input.required<Requete>();
  /** Seule la première réponse attendue est un bouton plein. */
  readonly principale = input(false);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly accepter = output<void>();
  readonly refuser = output<string>();

  protected readonly textes = TEXTES_PROPRIETAIRE;
  protected readonly liens = LIENS_PROPRIETAIRE;
  protected readonly motifMax = MOTIF_MAX;
  /** Volet ouvert ; il se referme quand la demande est rechargée après une action réussie. */
  protected readonly volet = linkedSignal<Requete, Volet>({
    source: this.requete,
    computation: () => null,
  });
  protected readonly motif = signal('');
  protected readonly motifManquant = signal(false);
  protected readonly icone = computed(() => ICONES[this.requete().genre]);
  protected readonly couleur = computed(() => COULEURS_TON[this.requete().etat.ton]);
  protected readonly genre = computed(() => {
    const g = this.requete().genre;
    return g === 'visite'
      ? this.textes.genreVisite
      : g === 'location'
        ? this.textes.genreLocation
        : this.textes.genreOffre;
  });

  protected ouvrir(v: Volet): void {
    this.motifManquant.set(false);
    this.volet.update((actuel) => (actuel === v ? null : v));
  }

  /** L'offre acceptée refuse les autres : elle passe par une confirmation. */
  protected accepterDemande(): void {
    if (this.requete().genre === 'offre') this.ouvrir('accepter');
    else this.accepter.emit();
  }

  protected saisirMotif(valeur: string): void {
    this.motif.set(valeur);
    if (valeur.trim()) this.motifManquant.set(false);
  }

  protected envoyerRefus(): void {
    const motif = this.motif().trim();
    if (!motif) {
      this.motifManquant.set(true);
      return;
    }
    this.refuser.emit(motif);
  }
}
