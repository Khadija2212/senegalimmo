import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { valeurDateHeure } from './agent-vue';
import { TEXTES_AGENT } from './textes';

const SECONDES = ':00';

/** Cas « Reprogrammer une visite », côté agent : une nouvelle date, que le client reçoit. */
@Component({
  selector: 'si-reprogrammer-agent',
  imports: [HlmButton, HlmInput, HlmLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  template: `
    <label
      hlmLabel
      [for]="ident() + '-date'"
      class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
      >{{ textes.nouvelleDate }}</label
    >
    <input
      hlmInput
      type="datetime-local"
      [id]="ident() + '-date'"
      class="h-11 w-full max-w-[280px] bg-white tabular-nums"
      [min]="minimum"
      [value]="date()"
      (input)="date.set($any($event.target).value)"
    />
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <button
        hlmBtn
        size="grand"
        class="h-11"
        [disabled]="enCours() || !valide()"
        (click)="valider.emit(date() + secondes)"
      >
        {{ enCours() ? textes.envoiEnCours : textes.proposerDate }}
      </button>
      <button type="button" class="lien-texte" (click)="fermer.emit()">{{ textes.fermer }}</button>
    </div>
    <p class="text-encre-3 mt-2.5 text-[0.82rem]">{{ textes.noteReprog }}</p>
  `,
  host: { class: 'block rounded-cadre border border-ciel bg-brume p-[18px]' },
})
export class ReprogrammerAgent {
  readonly ident = input.required<string>();
  readonly enCours = input(false);
  readonly valider = output<string>();
  readonly fermer = output<void>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly secondes = SECONDES;
  protected readonly minimum = valeurDateHeure(new Date());
  protected readonly date = signal('');
  protected readonly valide = computed(() => this.date() > this.minimum);
}
