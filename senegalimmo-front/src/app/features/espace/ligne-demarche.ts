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
import { NomIcone } from '../../shared/icones/icones';
import { Demarche, Genre, Ton } from './demarches-vue';
import { ReprogrammerVisite } from './reprogrammer-visite';
import { TEXTES_ESPACE } from './textes';

type Volet = 'reprogrammer' | 'annuler' | 'retirer' | null;

const ICONES: Record<Genre, NomIcone> = {
  visite: 'siCle',
  location: 'siContrat',
  offre: 'siContrat',
};
const COULEURS: Record<Ton, string> = {
  ok: 'text-succes',
  attente: 'text-bleu-vif',
  non: 'text-refus',
  neutre: 'text-encre-3',
};
const CHEMIN_ANNONCE = '/annonces';
const CHEMIN_MESSAGES = '/messages';

/** Une démarche du client, en registre : photo, état en clair, actions écrites. */
@Component({
  selector: 'si-ligne-demarche',
  imports: [RouterLink, NgIcon, HlmButton, ReprogrammerVisite],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ligne-demarche.html',
  styleUrls: ['./lien-texte.css', './ligne-demarche.css'],
  host: {
    class:
      'grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3.5 border-b border-border py-[18px] sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:gap-[18px]',
  },
})
export class LigneDemarche {
  readonly demarche = input.required<Demarche>();
  /** Seule la première action « À faire » est un bouton plein. */
  readonly principale = input(false);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly reprogrammer = output<string>();
  readonly annuler = output<void>();
  readonly retirer = output<void>();

  protected readonly textes = TEXTES_ESPACE;
  /** Volet ouvert ; il se referme quand la démarche est rechargée après une action réussie. */
  protected readonly volet = linkedSignal<Demarche, Volet>({
    source: this.demarche,
    computation: () => null,
  });
  protected readonly icone = computed(() => ICONES[this.demarche().genre]);
  protected readonly couleur = computed(() => COULEURS[this.demarche().etat.ton]);
  protected readonly lienAnnonce = computed(() => [CHEMIN_ANNONCE, this.demarche().annonce.id]);
  protected readonly cheminMessages = CHEMIN_MESSAGES;
  protected readonly genre = computed(() => {
    const g = this.demarche().genre;
    return g === 'visite'
      ? this.textes.genreVisite
      : g === 'location'
        ? this.textes.genreLocation
        : this.textes.genreOffre;
  });
  protected readonly quand = computed(() => {
    const f = this.demarche().fort;
    return f.charAt(0).toLowerCase() + f.slice(1);
  });
  protected readonly qui = computed(() => this.demarche().responsable ?? this.textes.laPersonne);
  /** Même personne, en début de phrase. */
  protected readonly quiDebut = computed(() => {
    const q = this.qui();
    return q.charAt(0).toUpperCase() + q.slice(1);
  });
  /** Libellés du bouton et de la confirmation : visite ou demande de location. */
  protected readonly annulation = computed(() =>
    this.demarche().genre === 'visite'
      ? {
          bouton: this.textes.annuler,
          question: this.textes.confirmerAnnulation(this.quand(), this.quiDebut()),
          oui: this.textes.ouiAnnuler,
        }
      : {
          bouton: this.textes.annulerDemande,
          question: this.textes.confirmerAnnulationDemande(this.quiDebut()),
          oui: this.textes.ouiAnnulerDemande,
        },
  );
  protected readonly libelleEcrire = computed(() => {
    const role = this.demarche().interlocuteur?.role;
    return role === this.textes.roleAgent
      ? this.textes.ecrireAgent
      : this.textes.ecrire(role ?? '');
  });

  protected ouvrir(v: Volet): void {
    this.volet.update((actuel) => (actuel === v ? null : v));
  }
}
