import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { DemarchesService, MotifSignalement } from '../../../core/services/demarches';
import { EnvoiDemarche } from '../panneau-demarche/envoi';
import { RetourEnvoi } from '../panneau-demarche/retour-envoi';
import { TEXTES_ANNONCE, TEXTES_SIGNALEMENT } from '../textes';

const MOTIFS = Object.keys(TEXTES_SIGNALEMENT.motifs) as MotifSignalement[];

/** Lien « Signaler cette annonce » qui ouvre le formulaire du cas « Signaler un problème ». */
@Component({
  selector: 'si-signaler',
  imports: [NgIcon, HlmButton, HlmLabel, HlmSelectImports, HlmTextarea, RetourEnvoi],
  providers: [EnvoiDemarche],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="text-encre-3 mt-11 flex items-center gap-2.5 border-t border-border pt-[18px] text-[0.9rem]"
    >
      <ng-icon name="siSignaler" size="18" />
      @if (envoi.confirmation()) {
        <span role="status">{{ textes.merci }}</span>
      } @else {
        <span
          >{{ textesAnnonce.infoFausse }}
          <button
            type="button"
            class="text-encre-2 underline underline-offset-4"
            [attr.aria-expanded]="ouvert()"
            (click)="ouvert.set(!ouvert())"
          >
            {{ textesAnnonce.signaler }}
          </button>
        </span>
      }
    </div>
    @if (ouvert() && !envoi.confirmation()) {
      <div class="bg-brume mt-4 rounded-cadre p-5">
        <span id="l-motif" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
          textes.motif
        }}</span>
        <hlm-select
          [value]="motif()"
          [itemToString]="libelleMotif"
          (valueChange)="$event && motif.set($event)"
        >
          <hlm-select-trigger aria-labelledby="l-motif" class="h-11 w-full bg-white sm:w-80"
            ><hlm-select-value
          /></hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            @for (m of motifs; track m) {
              <hlm-select-item [value]="m">{{ libelleMotif(m) }}</hlm-select-item>
            }
          </hlm-select-content>
        </hlm-select>
        <label
          hlmLabel
          for="f-description"
          class="text-encre-2 mt-4 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.description }}</label
        >
        <textarea
          hlmTextarea
          id="f-description"
          rows="3"
          class="w-full bg-white"
          [value]="description()"
          (input)="description.set($any($event.target).value)"
        ></textarea>
        <div class="mt-4 flex flex-wrap gap-3">
          <button
            hlmBtn
            size="grand"
            [disabled]="envoi.enCours() || !description().trim()"
            (click)="envoyer()"
          >
            {{ textes.envoyer }}
          </button>
          <button hlmBtn variant="trait" size="grand" (click)="ouvert.set(false)">
            {{ textes.annuler }}
          </button>
        </div>
        <si-retour-envoi />
      </div>
    }
  `,
})
export class Signaler {
  readonly annonceId = input.required<string>();
  protected readonly textes = TEXTES_SIGNALEMENT;
  protected readonly textesAnnonce = TEXTES_ANNONCE;
  protected readonly envoi = inject(EnvoiDemarche);
  private readonly demarches = inject(DemarchesService);
  protected readonly motifs = MOTIFS;
  protected readonly ouvert = signal(false);
  protected readonly motif = signal<MotifSignalement>('informations_erronees');
  protected readonly description = signal('');
  protected readonly libelleMotif = (m: MotifSignalement): string => this.textes.motifs[m];

  protected envoyer(): void {
    this.envoi.envoyer(
      () =>
        this.demarches.signaler({
          annonce_id: this.annonceId(),
          motif: this.motif(),
          description: this.description().trim(),
        }),
      { titre: '', texte: this.textes.merci, lien: '', libelleLien: '' },
    );
  }
}
