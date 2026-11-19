import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { SignalementAdmin, StatutSignalement } from '../../../core/modeles/admin';
import { dateCourte } from '../commun/dates';
import { TEXTES_SIGNALEMENTS } from './textes';

const COULEURS: Readonly<Record<StatutSignalement, string>> = {
  ouvert: 'text-bleu-vif',
  en_cours: 'text-bleu-vif',
  resolu: 'text-succes',
  rejete: 'text-encre-3',
};
const CHEMIN_ANNONCE = '/annonces';

/** Un signalement : motif en clair, annonce, auteur, description, puis résolution écrite. */
@Component({
  selector: 'si-ligne-signalement',
  imports: [RouterLink, HlmButton, HlmLabel, HlmTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/lien-texte.css',
  template: `
    @let s = signalement();
    <div class="min-w-0">
      <span class="text-encre-3 text-[0.78rem] font-semibold tracking-[0.06em] uppercase">
        {{ textes.motifs[s.motif] }}
      </span>
      <h3 class="mt-1 text-[1.02rem] leading-snug font-semibold">
        @if (s.annonce?.bien; as b) {
          <a
            [routerLink]="[cheminAnnonce, s.annonce!.id]"
            class="hover:underline hover:underline-offset-[3px]"
            >{{ b.titre }}</a
          >
        } @else {
          {{ textes.annonceSupprimee }}
        }
      </h3>
      <p class="text-encre-2 mt-1 text-[0.88rem]">{{ auteur() }}</p>
      <p class="mt-2 max-w-[70ch] text-[0.92rem] whitespace-pre-line">{{ s.description }}</p>
      <p class="mt-2 text-[0.88rem]">
        <b class="font-semibold" [class]="couleur()">{{ textes.statuts[s.statut] }}</b>
        @if (s.traite_le) {
          <span class="text-encre-2 ml-1.5">{{ textes.traiteLe(date(s.traite_le)) }}</span>
        }
      </p>
      @if (s.resolution) {
        <p class="text-encre-2 mt-1 max-w-[70ch] text-[0.88rem] whitespace-pre-line">
          <b class="text-foreground font-semibold">{{ textes.resolution }} :</b> {{ s.resolution }}
        </p>
      }
    </div>

    @if (s.statut === 'ouvert' || s.statut === 'en_cours') {
      <div class="flex sm:justify-end">
        <button
          type="button"
          class="lien-texte"
          [attr.aria-expanded]="ouvert()"
          (click)="ouvert.set(!ouvert())"
        >
          {{ textes.traiter }}
        </button>
      </div>
    }

    @if (ouvert()) {
      <div class="rounded-cadre border-ciel bg-brume border p-[18px] sm:col-span-2">
        <label
          hlmLabel
          [for]="'resolution-' + s.id"
          class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.labelResolution }}</label
        >
        <textarea
          hlmTextarea
          [id]="'resolution-' + s.id"
          rows="3"
          class="w-full bg-white"
          [placeholder]="textes.placeholderResolution"
          [value]="resolution()"
          (input)="resolution.set($any($event.target).value)"
        ></textarea>
        <div class="mt-4 flex flex-wrap items-center gap-4">
          <button
            hlmBtn
            size="grand"
            class="h-11"
            [disabled]="enCours() || !resolution().trim()"
            (click)="traiter.emit(resolution().trim())"
          >
            {{ textes.envoyer }}
          </button>
          <button type="button" class="lien-texte" (click)="ouvert.set(false)">
            {{ textes.fermer }}
          </button>
        </div>
      </div>
    }
    @if (erreur(); as e) {
      <p class="text-destructive text-[0.85rem] sm:col-span-2" role="alert">{{ e }}</p>
    }
  `,
  host: {
    class:
      'grid grid-cols-1 items-start gap-3 border-b border-border py-[18px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-[18px]',
  },
})
export class LigneSignalement {
  readonly signalement = input.required<SignalementAdmin>();
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly traiter = output<string>();

  protected readonly textes = TEXTES_SIGNALEMENTS;
  protected readonly cheminAnnonce = CHEMIN_ANNONCE;
  protected readonly date = dateCourte;
  protected readonly ouvert = linkedSignal({ source: this.signalement, computation: () => false });
  protected readonly resolution = linkedSignal({ source: this.signalement, computation: () => '' });
  protected readonly couleur = computed(() => COULEURS[this.signalement().statut]);
  protected readonly auteur = computed(() => {
    const s = this.signalement();
    const nom = s.client ? `${s.client.prenom} ${s.client.nom}` : this.textes.auteurInconnu;
    return this.textes.par(nom, dateCourte(s.created_at));
  });
}
