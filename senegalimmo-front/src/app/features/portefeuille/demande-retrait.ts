import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { fcfa } from '../../core/format/fcfa';
import { MethodeRetrait } from '../../core/modeles/portefeuille';
import { messageErreur } from '../../core/services/demarches';
import { PortefeuilleService } from '../../core/services/portefeuille';
import { erreursParChamp } from '../connexion/erreurs';
import { NUMERO_BENEFICIAIRE, erreurMontant } from './portefeuille-vue';
import { METHODES_RETRAIT, TEXTES_PORTEFEUILLE } from './textes';

type ChampRetrait = 'montant' | 'methode' | 'numero_beneficiaire';

/** Cas « Demander un retrait » : POST /api/retraits, le montant est bloqué tout de suite. */
@Component({
  selector: 'si-demande-retrait',
  imports: [ReactiveFormsModule, HlmButton, HlmInput, HlmLabel, HlmToggleGroupImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demande-retrait.html',
  host: { class: 'block' },
})
export class DemandeRetrait {
  readonly minimum = input.required<number>();
  readonly disponible = input.required<number>();
  /** Retrait demandé : message de réussite à afficher. */
  readonly demande = output<string>();

  protected readonly t = TEXTES_PORTEFEUILLE;
  protected readonly methodes = METHODES_RETRAIT;
  protected readonly fcfa = fcfa;
  private readonly service = inject(PortefeuilleService);
  protected readonly enCours = signal(false);
  protected readonly alerte = signal<string | null>(null);

  private readonly montantValide = (c: AbstractControl): ValidationErrors | null => {
    if (c.value === null || c.value === '') return null;
    const e = erreurMontant(Number(c.value), this.minimum(), this.disponible());
    return e ? { montant: e } : null;
  };

  protected readonly form = new FormGroup({
    montant: new FormControl<number | null>(null, {
      validators: [Validators.required, this.montantValide],
    }),
    methode: new FormControl<MethodeRetrait>('wave', { nonNullable: true }),
    numero_beneficiaire: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(NUMERO_BENEFICIAIRE)],
    }),
  });

  /** Le champ réactif ne prévient pas les signaux : on suit ses événements. */
  private readonly evenement = toSignal(this.form.events);

  protected message(champ: ChampRetrait): string | null {
    this.evenement();
    const c = this.form.controls[champ];
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return this.t.requis;
    if (typeof c.errors['montant'] === 'string') return c.errors['montant'];
    if (c.errors['pattern']) return this.t.numeroInvalide;
    return typeof c.errors['serveur'] === 'string' ? c.errors['serveur'] : null;
  }

  protected envoyer(): void {
    this.alerte.set(null);
    this.form.controls.montant.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const montant = Number(v.montant);
    this.enCours.set(true);
    this.service
      .demanderRetrait({ montant, methode: v.methode, numero_beneficiaire: v.numero_beneficiaire })
      .subscribe({
        next: () => {
          this.enCours.set(false);
          this.form.reset({
            montant: null,
            methode: v.methode,
            numero_beneficiaire: v.numero_beneficiaire,
          });
          this.demande.emit(this.t.retraitDemande(fcfa(montant)));
        },
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
      this.alerte.set(messageErreur(e, this.t.erreurRetrait));
      return;
    }
    for (const champ of champs) {
      const controle = this.form.get(champ);
      controle?.setErrors({ serveur: parChamp[champ] });
      controle?.markAsTouched();
    }
  }
}
