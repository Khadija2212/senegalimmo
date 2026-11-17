import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { lireMontant, nombre } from '../../../core/format/fcfa';
import { AnnonceDetaillee } from '../../../core/modeles/annonce';
import { DemarchesService } from '../../../core/services/demarches';
import { TEXTES_DEMARCHE } from '../textes';
import { EnvoiDemarche } from './envoi';
import { RetourEnvoi } from './retour-envoi';

const RABAIS_PROPOSE = 0.05;
const POURCENT = 100;
const CHEMIN_OFFRES = '/offres';

/** Onglet « Faire une offre » : cas « Soumettre une offre d'achat », valable 7 jours. */
@Component({
  selector: 'si-onglet-offre',
  imports: [NgIcon, HlmButton, HlmInput, HlmLabel, HlmTextarea, RetourEnvoi],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label hlmLabel for="f-montant" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
      textes.montant
    }}</label>
    <input
      hlmInput
      id="f-montant"
      inputmode="numeric"
      class="h-11 w-full bg-white tabular-nums"
      [value]="saisie()"
      (input)="saisir($any($event.target))"
    />
    <p class="text-encre-3 mt-1.5 text-[0.8rem]" aria-live="polite">{{ ecart() }}</p>
    <label
      hlmLabel
      for="f-message-offre"
      class="text-encre-2 mt-4 mb-2 block text-[0.8rem] font-semibold"
      >{{ textes.messageVendeur }}</label
    >
    <textarea
      hlmTextarea
      id="f-message-offre"
      rows="3"
      class="w-full bg-white"
      [placeholder]="textes.placeholderOffre"
      [value]="message()"
      (input)="message.set($any($event.target).value)"
    ></textarea>

    <button
      hlmBtn
      size="grand"
      class="mt-5 h-[52px] w-full"
      [disabled]="envoi.enCours() || !montant()"
      (click)="envoyer()"
    >
      <ng-icon name="siContrat" />{{
        envoi.enCours() ? textes.envoiEnCours : textes.soumettreOffre
      }}
    </button>
    <si-retour-envoi />
    <p class="text-encre-3 mt-2.5 text-[0.82rem]">{{ textes.noteOffre }}</p>
  `,
})
export class OngletOffre implements OnInit {
  readonly annonce = input.required<AnnonceDetaillee>();
  protected readonly textes = TEXTES_DEMARCHE;
  protected readonly envoi = inject(EnvoiDemarche);
  private readonly demarches = inject(DemarchesService);
  protected readonly montant = signal(0);
  protected readonly message = signal('');
  protected readonly saisie = computed(() => (this.montant() ? nombre(this.montant()) : ''));

  protected readonly ecart = computed(() => {
    const prix = this.annonce().prix;
    const diff = Math.round((1 - this.montant() / prix) * POURCENT);
    if (diff > 0) return this.textes.sousPrix(diff);
    return diff < 0 ? this.textes.surPrix(-diff) : this.textes.auPrix;
  });

  ngOnInit(): void {
    this.montant.set(Math.round(this.annonce().prix * (1 - RABAIS_PROPOSE)));
  }

  protected saisir(champ: HTMLInputElement): void {
    this.montant.set(lireMontant(champ.value));
    champ.value = this.saisie();
  }

  protected envoyer(): void {
    const a = this.annonce();
    const qui = a.bien.proprietaire
      ? `${a.bien.proprietaire.prenom} ${a.bien.proprietaire.nom}`
      : '';
    this.envoi.envoyer(
      () =>
        this.demarches.soumettreOffre({
          annonce_id: a.id,
          montant: this.montant(),
          message: this.message() || undefined,
        }),
      {
        titre: this.textes.offreSoumise,
        texte: this.textes.offreTexte(qui),
        lien: CHEMIN_OFFRES,
        libelleLien: this.textes.voirOffres,
      },
    );
  }
}
