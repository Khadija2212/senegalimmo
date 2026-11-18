import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { SessionService } from '../../core/session/session';
import { ChampSecret } from './champ-secret';
import { messageChamp, messageRefus } from './erreurs';
import { TEXTES_CONNEXION } from './textes';

/** Cas « S'authentifier » : POST /api/connexion, la session revient dans un cookie. */
@Component({
  selector: 'si-formulaire-connexion',
  imports: [ReactiveFormsModule, HlmInput, HlmLabel, HlmButton, ChampSecret],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="envoyer()" novalidate>
      @if (alerte(); as a) {
        <p
          class="border-destructive bg-alerte text-alerte-texte mb-[18px] rounded-r-lg border-l-[3px] px-3.5 py-3 text-[0.9rem]"
          role="alert"
        >
          {{ a }}
        </p>
      }
      <label
        hlmLabel
        for="c-email"
        class="text-encre-2 mb-[7px] block text-[0.82rem] font-semibold"
        >{{ textes.email }}</label
      >
      <input
        hlmInput
        id="c-email"
        type="email"
        autocomplete="email"
        class="h-[46px] bg-white text-[0.95rem]"
        formControlName="email"
        aria-describedby="c-email-faute"
      />
      @if (message(form.controls.email); as m) {
        <p id="c-email-faute" class="text-destructive mt-1.5 text-[0.82rem]">{{ m }}</p>
      }

      <label
        hlmLabel
        for="c-mdp"
        class="text-encre-2 mt-4 mb-[7px] block text-[0.82rem] font-semibold"
        >{{ textes.motDePasse }}</label
      >
      <si-champ-secret
        champId="c-mdp"
        [controle]="form.controls.password"
        decritPar="c-mdp-faute"
      />
      @if (message(form.controls.password); as m) {
        <p id="c-mdp-faute" class="text-destructive mt-1.5 text-[0.82rem]">{{ m }}</p>
      }

      <button hlmBtn size="grand" type="submit" class="mt-5 h-[52px] w-full" [disabled]="enCours()">
        {{ enCours() ? textes.connexionEnCours : textes.seConnecter }}
      </button>
      <p class="text-encre-2 mt-[18px] text-[0.92rem]">
        {{ textes.pasDeCompte }}
        <button
          type="button"
          class="text-bleu font-semibold underline underline-offset-4"
          (click)="versInscription.emit()"
        >
          {{ textes.creerCompte }}
        </button>
      </p>
    </form>
  `,
})
export class FormulaireConnexion {
  readonly reussi = output<void>();
  readonly versInscription = output<void>();
  protected readonly textes = TEXTES_CONNEXION;
  protected readonly message = messageChamp;
  protected readonly enCours = signal(false);
  protected readonly alerte = signal<string | null>(null);
  private readonly session = inject(SessionService);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected envoyer(): void {
    this.alerte.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enCours.set(true);
    this.session.connecter(this.form.getRawValue()).subscribe({
      next: () => this.reussi.emit(),
      error: (e: unknown) => {
        this.enCours.set(false);
        this.alerte.set(messageRefus(e));
      },
    });
  }
}
