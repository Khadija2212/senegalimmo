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
import { FormulaireAnnonce, SaisieAnnonce } from './formulaire-annonce';
import { LigneBien as Ligne } from './registres-vue';
import { LIENS_AGENT, TEXTES_AGENT } from './textes';

/** Un bien sous mandat, en registre : propriétaire, statut, annonce. */
@Component({
  selector: 'si-ligne-bien',
  imports: [RouterLink, NgIcon, HlmButton, FormulaireAnnonce],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
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
        <ng-icon name="siImmeuble" size="18" class="text-bleu" />{{ l.bien.quartier }},
        {{ l.bien.ville }}
      </span>
      <h3 class="mt-1 text-[1.02rem] leading-snug font-semibold">{{ l.bien.titre }}</h3>
      @if (l.proprietaire) {
        <p class="text-encre-2 mt-1 text-[0.9rem]">{{ textes.proprietaireDe(l.proprietaire) }}</p>
      }
      <p class="mt-2 text-[0.88rem]">
        <b class="font-semibold" [class]="couleur()">{{ l.etat.libelle }}</b>
        @if (l.etat.explication) {
          <span class="text-encre-2 block sm:ml-1.5 sm:inline">{{ l.etat.explication }}</span>
        }
      </p>
    </div>

    <div class="col-start-2 flex flex-col items-start gap-2 sm:col-start-auto sm:items-end">
      @if (!l.annonce) {
        @if (principale()) {
          <button
            hlmBtn
            class="h-[42px] px-4 text-[0.9rem]"
            [attr.aria-expanded]="ouvert()"
            (click)="ouvert.set(!ouvert())"
          >
            {{ textes.publierAnnonce }}
          </button>
        } @else {
          <button
            type="button"
            class="lien-texte"
            [attr.aria-expanded]="ouvert()"
            (click)="ouvert.set(!ouvert())"
          >
            {{ textes.publierAnnonce }}
          </button>
        }
      } @else if (l.annonce.statut === 'publiee') {
        <a class="lien-texte" [routerLink]="[liens.annonce, l.annonce.id]">{{
          textes.voirAnnonce
        }}</a>
      }
    </div>

    @if (ouvert()) {
      <si-formulaire-annonce
        class="col-span-2 sm:col-start-2"
        [ident]="'bien-' + l.bien.id"
        [enCours]="enCours()"
        (valider)="publier.emit($event)"
        (fermer)="ouvert.set(false)"
      />
    }
    @if (erreur(); as e) {
      <p class="text-destructive col-span-2 text-[0.85rem] sm:col-start-2" role="alert">{{ e }}</p>
    }
  `,
  host: { class: CLASSE_LIGNE },
})
export class LigneBien {
  readonly ligne = input.required<Ligne>();
  readonly principale = input(false);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly publier = output<SaisieAnnonce>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly liens = LIENS_AGENT;
  /** Formulaire ouvert ; il se referme quand la ligne est rechargée après la publication. */
  protected readonly ouvert = linkedSignal<Ligne, boolean>({
    source: this.ligne,
    computation: () => false,
  });
  protected readonly couleur = computed(() => COULEURS[this.ligne().etat.ton]);
}
