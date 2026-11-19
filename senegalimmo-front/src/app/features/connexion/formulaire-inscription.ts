import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmRadioGroupImports } from '@spartan-ng/helm/radio-group';
import { RoleInscription, SessionService } from '../../core/session/session';
import { ChampSecret } from './champ-secret';
import { erreursParChamp, messageChamp, messageRefus } from './erreurs';
import { PROFILS, TEXTES_CONNEXION } from './textes';

const LONGUEUR_MIN_MOT_DE_PASSE = 8;
/** Neuf chiffres, espaces libres : le numéro national sénégalais. */
const NUMERO_NATIONAL = /^\s*(\d\s*){9}$/;
const CHAMP_EMAIL = 'email';

function memeMotDePasse(c: AbstractControl): ValidationErrors | null {
  const motDePasse = c.parent?.get('password')?.value;
  return c.value && c.value !== motDePasse ? { differente: true } : null;
}

/** Cas « S'inscrire » : POST /api/inscription avec le rôle choisi, puis session ouverte. */
@Component({
  selector: 'si-formulaire-inscription',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    HlmInput,
    HlmLabel,
    HlmButton,
    HlmRadioGroupImports,
    ChampSecret,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './formulaire-inscription.html',
})
export class FormulaireInscription {
  readonly reussi = output<void>();
  readonly versConnexion = output<void>();
  protected readonly textes = TEXTES_CONNEXION;
  protected readonly profils = PROFILS;
  protected readonly message = messageChamp;
  protected readonly enCours = signal(false);
  protected readonly alerte = signal<string | null>(null);
  protected readonly emailPris = signal(false);
  private readonly session = inject(SessionService);

  protected readonly form = new FormGroup({
    role: new FormControl<RoleInscription>('client', { nonNullable: true }),
    prenom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    telephone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(NUMERO_NATIONAL)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LONGUEUR_MIN_MOT_DE_PASSE)],
    }),
    password_confirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, memeMotDePasse],
    }),
  });

  private readonly role = toSignal(this.form.controls.role.valueChanges, {
    initialValue: this.form.controls.role.value,
  });
  protected readonly note = computed(
    () => this.profils.find((p) => p.role === this.role())?.note ?? null,
  );

  constructor() {
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.password_confirmation.updateValueAndValidity());
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.emailPris.set(false));
  }

  protected envoyer(): void {
    this.alerte.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valeurs = this.form.getRawValue();
    this.enCours.set(true);
    this.session
      .inscrire({
        ...valeurs,
        telephone: `${this.textes.indicatif}${valeurs.telephone.replace(/\s/g, '')}`,
      })
      .subscribe({
        next: () => this.reussi.emit(),
        error: (e: unknown) => {
          this.enCours.set(false);
          this.afficherRefus(e);
        },
      });
  }

  private afficherRefus(e: unknown): void {
    const parChamp = erreursParChamp(e);
    const champs = Object.keys(parChamp).filter((c) => c in this.form.controls);
    if (!champs.length) {
      this.alerte.set(messageRefus(e));
      return;
    }
    for (const champ of champs) {
      const controle = this.form.get(champ);
      const pris = champ === CHAMP_EMAIL;
      controle?.setErrors({ serveur: pris ? this.textes.emailDejaPris : parChamp[champ] });
      controle?.markAsTouched();
      if (pris) this.emailPris.set(true);
    }
  }
}
