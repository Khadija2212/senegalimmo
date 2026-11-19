import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HlmInput } from '@spartan-ng/helm/input';
import { TEXTES_CONNEXION } from './textes';

/** Champ de mot de passe avec un bouton « Afficher » écrit en toutes lettres. */
@Component({
  selector: 'si-champ-secret',
  imports: [ReactiveFormsModule, HlmInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <input
        hlmInput
        class="h-[46px] bg-white pr-[84px] text-[0.95rem]"
        [id]="champId()"
        [type]="visible() ? 'text' : 'password'"
        [autocomplete]="autocomplete()"
        [formControl]="controle()"
        [attr.aria-describedby]="decritPar()"
      />
      <button
        type="button"
        class="text-bleu hover:bg-brume absolute top-1.5 right-1.5 h-[34px] rounded-md px-2.5 text-[0.85rem] font-semibold"
        [attr.aria-controls]="champId()"
        [attr.aria-pressed]="visible()"
        (click)="visible.update((v) => !v)"
      >
        {{ visible() ? textes.masquer : textes.afficher }}
      </button>
    </div>
  `,
})
export class ChampSecret {
  readonly controle = input.required<FormControl<string>>();
  readonly champId = input.required<string>();
  readonly autocomplete = input<'current-password' | 'new-password'>('current-password');
  readonly decritPar = input<string | null>(null);
  protected readonly visible = signal(false);
  protected readonly textes = TEXTES_CONNEXION;
}
