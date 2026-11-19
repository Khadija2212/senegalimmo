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
import { LigneClient as Ligne } from './clients-vue';
import { SaisieMotif } from './saisie-motif';
import { LIENS_AGENT, TEXTES_AGENT } from './textes';

type Volet = 'accepter' | 'refuser' | null;

/** Cas « Traiter demandes clients » : une demande de location ou une offre, en registre. */
@Component({
  selector: 'si-ligne-client',
  imports: [RouterLink, NgIcon, HlmButton, SaisieMotif],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../shared/espace/lien-texte.css', '../../shared/espace/confirmer.css'],
  template: `
    @let l = ligne();
    @if (l.photo) {
      <img [src]="l.photo" alt="" class="size-16 rounded-champ object-cover sm:h-[72px] sm:w-24" />
    } @else {
      <span class="bg-brume size-16 rounded-champ sm:h-[72px] sm:w-24"></span>
    }

    <div class="min-w-0">
      <span
        class="text-encre-3 flex items-center gap-2 text-[0.78rem] font-semibold tracking-[0.06em] uppercase"
      >
        <ng-icon name="siContrat" size="18" class="text-bleu" />{{ genre() }}
      </span>
      <h3 class="mt-1 text-[1.02rem] leading-snug font-semibold">
        <a [routerLink]="lienAnnonce()" class="hover:underline hover:underline-offset-[3px]">{{
          l.annonce.bien.titre
        }}</a>
      </h3>
      <p class="text-encre-2 mt-1 text-[0.9rem] tabular-nums">
        <b class="text-foreground font-semibold">{{ l.fort }}</b
        >{{ l.suite }}
      </p>
      <p class="text-encre-2 mt-1 text-[0.9rem]">
        {{ textes.client(l.nomClient, l.client.telephone) }}
      </p>
      <p class="mt-2 text-[0.88rem]">
        <b class="font-semibold" [class]="couleur()">{{ l.etat.libelle }}</b>
        @if (l.etat.explication) {
          <span class="text-encre-2 block sm:ml-1.5 sm:inline">{{ l.etat.explication }}</span>
        }
      </p>
      @if (l.enAttente && l.genre === 'offre') {
        <p class="text-encre-3 mt-1 text-[0.82rem]">{{ textes.noteOffre }}</p>
      }
    </div>

    <div class="col-start-2 flex flex-col items-start gap-2 sm:col-start-auto sm:items-end">
      @if (l.peutAccepter) {
        @if (principale()) {
          <button
            hlmBtn
            class="h-[42px] px-4 text-[0.9rem]"
            [attr.aria-expanded]="volet() === 'accepter'"
            (click)="ouvrir('accepter')"
          >
            {{ textes.accepterDemande }}
          </button>
        } @else {
          <button
            type="button"
            class="lien-texte"
            [attr.aria-expanded]="volet() === 'accepter'"
            (click)="ouvrir('accepter')"
          >
            {{ textes.accepterDemande }}
          </button>
        }
      }
      @if (l.enAttente) {
        <button
          type="button"
          class="lien-texte danger"
          [attr.aria-expanded]="volet() === 'refuser'"
          (click)="ouvrir('refuser')"
        >
          {{ l.genre === 'offre' ? textes.refuserOffre : textes.refuserDemande }}
        </button>
        <a
          class="lien-texte"
          [routerLink]="liens.messages"
          [queryParams]="{ a: l.client.id, annonce: l.annonce.id }"
          >{{ textes.ecrireClient }}</a
        >
      }
    </div>

    @switch (volet()) {
      @case ('accepter') {
        <div class="confirmer col-span-2 sm:col-start-2" role="alert">
          {{ textes.confirmerAcceptation(l.nomClient) }}
          <button
            type="button"
            class="lien-texte text-alerte-texte"
            [disabled]="enCours()"
            (click)="accepter.emit()"
          >
            {{ textes.ouiAccepter }}
          </button>
          <button type="button" class="lien-texte text-alerte-texte" (click)="volet.set(null)">
            {{ textes.nonGarder }}
          </button>
        </div>
      }
      @case ('refuser') {
        <si-saisie-motif
          class="col-span-2 sm:col-start-2"
          [ident]="l.cle"
          [libelle]="textes.motifRefus"
          [oui]="l.genre === 'offre' ? textes.refuserOffre : textes.refuserDemande"
          [exemple]="textes.placeholderMotifDemande"
          [enCours]="enCours()"
          (valider)="refuser.emit($event)"
          (fermer)="volet.set(null)"
        />
      }
    }
    @if (erreur(); as e) {
      <p class="text-destructive col-span-2 text-[0.85rem] sm:col-start-2" role="alert">{{ e }}</p>
    }
  `,
  host: { class: CLASSE_LIGNE },
})
export class LigneClient {
  readonly ligne = input.required<Ligne>();
  readonly principale = input(false);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly accepter = output<void>();
  readonly refuser = output<string>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly liens = LIENS_AGENT;
  protected readonly volet = linkedSignal<Ligne, Volet>({
    source: this.ligne,
    computation: () => null,
  });
  protected readonly couleur = computed(() => COULEURS[this.ligne().etat.ton]);
  protected readonly lienAnnonce = computed(() => [this.liens.annonce, this.ligne().annonce.id]);
  protected readonly genre = computed(() =>
    this.ligne().genre === 'offre' ? this.textes.genreOffre : this.textes.genreLocation,
  );

  protected ouvrir(v: Volet): void {
    this.volet.update((actuel) => (actuel === v ? null : v));
  }
}
