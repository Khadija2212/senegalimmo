import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmToggle } from '@spartan-ng/helm/toggle';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { lireMontant } from '../../../core/format/fcfa';
import { RechercheAccueil } from '../recherche-accueil';
import { TEXTES_ACCUEIL } from '../textes';

const CHOIX_CHAMBRES = [1, 2, 3, 4] as const;

/** Critères supplémentaires du cas « Filtrer par critères ». */
@Component({
  selector: 'si-criteres-plus',
  imports: [HlmInput, HlmLabel, HlmToggle, HlmToggleGroupImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end gap-x-8 gap-y-5">
      <div>
        <span
          hlmLabel
          id="l-chambres"
          class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.chambresMin }}</span
        >
        <hlm-toggle-group
          type="single"
          variant="case"
          [spacing]="1.5"
          aria-labelledby="l-chambres"
          [nullable]="true"
          [value]="chambres()"
          (valueChange)="recherche.modifier({ chambres_min: $any($event) ?? undefined })"
        >
          @for (n of choix; track n) {
            <button hlmToggleGroupItem [value]="n" class="min-w-12 px-3">{{ n }}+</button>
          }
        </hlm-toggle-group>
      </div>
      <div>
        <label
          hlmLabel
          for="f-surface"
          class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.surfaceMin }}</label
        >
        <input
          hlmInput
          id="f-surface"
          inputmode="numeric"
          class="h-9 w-32 bg-white"
          [value]="recherche.criteres().surface_min ?? ''"
          (input)="recherche.modifier({ surface_min: lire($any($event.target).value) })"
        />
      </div>
      <button
        hlmToggle
        variant="case"
        type="button"
        class="px-4"
        [attr.aria-pressed]="!!recherche.criteres().meuble"
        (click)="recherche.modifier({ meuble: !recherche.criteres().meuble })"
      >
        {{ textes.meuble }}
      </button>
    </div>
  `,
})
export class CriteresPlus {
  protected readonly recherche = inject(RechercheAccueil);
  protected readonly textes = TEXTES_ACCUEIL;
  protected readonly choix = CHOIX_CHAMBRES;
  protected readonly chambres = computed(() => this.recherche.criteres().chambres_min ?? null);

  protected lire(saisie: string): number | undefined {
    return lireMontant(saisie) || undefined;
  }
}
