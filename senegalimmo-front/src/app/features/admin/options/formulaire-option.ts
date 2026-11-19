import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { lireMontant, nombre } from '../../../core/format/fcfa';
import { OptionPremium, SaisieOption } from '../../../core/modeles/admin';
import { TEXTES_OPTIONS } from './textes';

/** Borne du backend (OptionPremiumAdminController::DUREE_MAX_JOURS). */
const DUREE_MAX_JOURS = 365;
const DUREE_DEFAUT = 30;
const LONGUEUR_MAX_LIBELLE = 100;

/** Création ou modification d'une option premium : libellé, durée, prix. */
@Component({
  selector: 'si-formulaire-option',
  imports: [HlmButton, HlmInput, HlmLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/lien-texte.css',
  template: `
    <h3 class="text-[1.02rem] font-semibold">{{ titre() }}</h3>
    <div class="mt-3 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <label
          hlmLabel
          [for]="ident() + '-libelle'"
          class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.labelLibelle }}</label
        >
        <input
          hlmInput
          [id]="ident() + '-libelle'"
          class="h-11 w-full bg-white"
          [maxLength]="longueurMax"
          [placeholder]="textes.placeholderLibelle"
          [value]="libelle()"
          (input)="libelle.set($any($event.target).value)"
        />
      </div>
      <div>
        <label
          hlmLabel
          [for]="ident() + '-duree'"
          class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.labelDuree }}</label
        >
        <input
          hlmInput
          [id]="ident() + '-duree'"
          type="number"
          min="1"
          [max]="dureeMax"
          class="h-11 w-full bg-white tabular-nums"
          [value]="duree()"
          [attr.aria-invalid]="!dureeValide()"
          (input)="duree.set(+$any($event.target).value)"
        />
      </div>
      <div>
        <label
          hlmLabel
          [for]="ident() + '-prix'"
          class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.labelPrix }}</label
        >
        <input
          hlmInput
          [id]="ident() + '-prix'"
          inputmode="numeric"
          class="h-11 w-full bg-white tabular-nums"
          [value]="prixLisible()"
          (input)="saisirPrix($any($event.target))"
        />
      </div>
    </div>
    @if (!dureeValide()) {
      <p class="text-destructive mt-2 text-[0.85rem]" role="alert">
        {{ textes.dureeInvalide(dureeMax) }}
      </p>
    }
    <div class="mt-5 flex flex-wrap items-center gap-4">
      <button
        hlmBtn
        size="grand"
        class="h-11"
        [disabled]="enCours() || !valide()"
        (click)="envoyer()"
      >
        {{ option() ? textes.enregistrer : textes.creerOption }}
      </button>
      <button type="button" class="lien-texte" (click)="fermer.emit()">{{ textes.fermer }}</button>
    </div>
    @if (erreur(); as e) {
      <p class="text-destructive mt-3 text-[0.85rem]" role="alert">{{ e }}</p>
    }
  `,
  host: { class: 'block rounded-cadre border border-ciel bg-brume p-[18px]' },
})
export class FormulaireOption {
  /** Option à modifier ; absente pour une création. */
  readonly option = input<OptionPremium | null>(null);
  readonly ident = input.required<string>();
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly enregistrer = output<SaisieOption>();
  readonly fermer = output<void>();

  protected readonly textes = TEXTES_OPTIONS;
  protected readonly dureeMax = DUREE_MAX_JOURS;
  protected readonly longueurMax = LONGUEUR_MAX_LIBELLE;
  protected readonly libelle = linkedSignal(() => this.option()?.libelle ?? '');
  protected readonly duree = linkedSignal(() => this.option()?.duree_jours ?? DUREE_DEFAUT);
  protected readonly prix = linkedSignal(() => this.option()?.prix ?? 0);

  protected readonly titre = computed(() => {
    const o = this.option();
    return o ? this.textes.modification(o.libelle) : this.textes.nouvelle;
  });
  protected readonly prixLisible = computed(() => (this.prix() ? nombre(this.prix()) : ''));
  protected readonly dureeValide = computed(() => {
    const d = this.duree();
    return Number.isInteger(d) && d >= 1 && d <= DUREE_MAX_JOURS;
  });
  protected readonly valide = computed(() => !!this.libelle().trim() && this.dureeValide());

  protected saisirPrix(champ: HTMLInputElement): void {
    this.prix.set(lireMontant(champ.value));
    champ.value = this.prixLisible();
  }

  protected envoyer(): void {
    this.enregistrer.emit({
      libelle: this.libelle().trim(),
      duree_jours: this.duree(),
      prix: this.prix(),
      active: this.option()?.active ?? true,
    });
  }
}
