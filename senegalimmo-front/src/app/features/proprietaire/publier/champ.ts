import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { HlmLabel } from '@spartan-ng/helm/label';
import { switchMap } from 'rxjs';
import { messageChamp } from './formulaire';

/**
 * Libellé, champ projeté et message d'erreur. Pour un champ composé (liste, choix),
 * « groupe » rend un libellé que le champ désigne par aria-labelledby="<ident>-l".
 */
@Component({
  selector: 'si-champ',
  imports: [HlmLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (groupe()) {
      <span [id]="ident() + '-l'" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
        libelle()
      }}</span>
    } @else {
      <label hlmLabel [for]="ident()" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
        libelle()
      }}</label>
    }
    <ng-content />
    @if (message(); as m) {
      <p [id]="ident() + '-err'" class="text-destructive mt-1.5 text-[0.82rem]" role="alert">
        {{ m }}
      </p>
    } @else if (note()) {
      <p class="text-encre-3 mt-1.5 text-[0.8rem]">{{ note() }}</p>
    }
  `,
})
export class Champ {
  readonly ident = input.required<string>();
  readonly libelle = input.required<string>();
  readonly controle = input.required<AbstractControl>();
  readonly groupe = input(false);
  readonly note = input<string | null>(null);

  /** Le champ réactif ne prévient pas les signaux : on suit ses événements. */
  private readonly evenement = toSignal(
    toObservable(this.controle).pipe(switchMap((c) => c.events)),
  );
  protected readonly message = computed(() => {
    this.evenement();
    return messageChamp(this.controle());
  });
}
