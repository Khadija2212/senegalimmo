import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { messageErreur } from '../../core/services/demarches';
import { ProfilService } from '../../core/services/profil';
import { ChampSecret } from '../connexion/champ-secret';
import { erreursParChamp } from '../connexion/erreurs';
import { messageChamp } from './erreurs';
import { TEXTES_PROFIL } from './textes';

const LONGUEUR_MIN_MOT_DE_PASSE = 8;

function memeMotDePasse(c: AbstractControl): ValidationErrors | null {
  const nouveau = c.parent?.get('nouveau')?.value;
  return c.value && c.value !== nouveau ? { differente: true } : null;
}

/** Bloc « Mot de passe » : PUT /profil/mot-de-passe avec l'ancien, le nouveau et sa confirmation. */
@Component({
  selector: 'si-mot-de-passe',
  imports: [ReactiveFormsModule, HlmButton, HlmLabel, ChampSecret],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mot-de-passe.html',
  host: { class: 'block min-w-0' },
})
export class MotDePasse {
  protected readonly textes = TEXTES_PROFIL;
  protected readonly message = messageChamp;
  private readonly service = inject(ProfilService);

  protected readonly enCours = signal(false);
  protected readonly succes = signal(false);
  protected readonly alerte = signal<string | null>(null);

  protected readonly form = new FormGroup({
    ancien: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nouveau: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LONGUEUR_MIN_MOT_DE_PASSE)],
    }),
    nouveau_confirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, memeMotDePasse],
    }),
  });

  constructor() {
    this.form.controls.nouveau.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.nouveau_confirmation.updateValueAndValidity());
  }

  protected envoyer(): void {
    this.alerte.set(null);
    this.succes.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enCours.set(true);
    this.service.changerMotDePasse(this.form.getRawValue()).subscribe({
      next: () => {
        this.enCours.set(false);
        this.form.reset();
        this.succes.set(true);
      },
      error: (e: unknown) => {
        this.enCours.set(false);
        this.afficherRefus(e);
      },
    });
  }

  /** Un 422 sans détail par champ vient de la règle « mot de passe actuel incorrect ». */
  private afficherRefus(e: unknown): void {
    const parChamp = erreursParChamp(e);
    const champs = Object.keys(parChamp).filter((c) => c in this.form.controls);
    if (!champs.length && estRefusMetier(e)) {
      parChamp['ancien'] = messageErreur(e, this.textes.erreurEnvoi);
      champs.push('ancien');
    }
    if (!champs.length) {
      this.alerte.set(messageErreur(e, this.textes.erreurEnvoi));
      return;
    }
    for (const champ of champs) {
      const controle = this.form.get(champ);
      controle?.setErrors({ serveur: parChamp[champ] });
      controle?.markAsTouched();
    }
  }
}

function estRefusMetier(e: unknown): boolean {
  return e instanceof HttpErrorResponse && e.status === HttpStatusCode.UnprocessableEntity;
}
