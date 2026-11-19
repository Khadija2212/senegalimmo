import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
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
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { AgentValide, TypeMandat } from '../../../core/modeles/proprietaire';
import { ProprietaireService } from '../../../core/services/proprietaire';
import { messageErreur } from '../../../core/services/demarches';
import { erreursParChamp } from '../../connexion/erreurs';
import { dansMois, nomComplet, versIso } from '../vue-commune';
import { BienLibre } from './mandats-vue';
import { TEXTES_MANDAT } from './textes-mandat';

type ChampMandat = 'bien_id' | 'taux_commission' | 'date_debut' | 'date_fin';

const TAUX_PAR_DEFAUT = 5;
const TAUX_MAX = 100;
const DUREE_PAR_DEFAUT_MOIS = 12;

function finApresDebut(c: AbstractControl): ValidationErrors | null {
  const debut = c.parent?.get('date_debut')?.value;
  return c.value && debut && c.value <= debut ? { finAvantDebut: true } : null;
}

/** Cas « Mandater un agent » : POST /api/mandats, puis signature depuis Contrats. */
@Component({
  selector: 'si-confier-bien',
  imports: [
    ReactiveFormsModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmSelectImports,
    HlmToggleGroupImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/lien-texte.css',
  templateUrl: './confier-bien.html',
  host: { class: 'block' },
})
export class ConfierBien implements OnInit {
  readonly agent = input.required<AgentValide>();
  readonly biens = input.required<readonly BienLibre[]>();
  readonly confie = output<string>();
  readonly fermer = output<void>();

  protected readonly textes = TEXTES_MANDAT;
  private readonly service = inject(ProprietaireService);
  protected readonly enCours = signal(false);
  protected readonly alerte = signal<string | null>(null);
  protected readonly aujourdhui = versIso(new Date());
  protected readonly titreDe = (id: string): string =>
    this.biens().find((b) => b.id === id)?.titre ?? '';

  protected readonly form = new FormGroup({
    bien_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<TypeMandat>('simple', { nonNullable: true }),
    taux_commission: new FormControl<number>(TAUX_PAR_DEFAUT, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(TAUX_MAX)],
    }),
    date_debut: new FormControl(this.aujourdhui, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    date_fin: new FormControl(versIso(dansMois(new Date(), DUREE_PAR_DEFAUT_MOIS)), {
      nonNullable: true,
      validators: [Validators.required, finApresDebut],
    }),
  });

  ngOnInit(): void {
    const seul = this.biens().length === 1 ? this.biens()[0].id : '';
    if (seul) this.form.controls.bien_id.setValue(seul);
  }

  protected message(nom: ChampMandat): string | null {
    const c = this.form.controls[nom];
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return this.textes.requis;
    if (c.errors['min'] || c.errors['max']) return this.textes.tauxInvalide;
    if (c.errors['finAvantDebut']) return this.textes.finAvantDebut;
    return typeof c.errors['serveur'] === 'string' ? c.errors['serveur'] : null;
  }

  protected envoyer(): void {
    this.alerte.set(null);
    this.form.controls.date_fin.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enCours.set(true);
    this.service.mandater({ agent_id: this.agent().id, ...this.form.getRawValue() }).subscribe({
      next: () => this.confie.emit(this.textes.confie(nomComplet(this.agent()))),
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
      this.alerte.set(messageErreur(e, this.textes.erreur));
      return;
    }
    for (const champ of champs) {
      const controle = this.form.get(champ);
      controle?.setErrors({ serveur: parChamp[champ] });
      controle?.markAsTouched();
    }
  }
}
