import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { lireMontant, nombre } from '../../../core/format/fcfa';
import { NouvelleRegle } from '../../../core/modeles/admin';
import { TypeTransaction } from '../../../core/modeles/annonce';
import { ChoixBascules } from '../commun/choix-bascules';
import { aujourdhuiIso } from '../commun/dates';
import { TEXTES_COMMISSIONS } from './textes';

const TAUX_MAX = 100;

/** Formulaire « Ajouter une règle » : type, taux en %, minimum, date d'effet. */
@Component({
  selector: 'si-formulaire-regle',
  imports: [HlmButton, HlmInput, HlmLabel, ChoixBascules],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/lien-texte.css',
  template: `
    <h3 class="text-[1.02rem] font-semibold">{{ textes.formulaire }}</h3>
    <span id="f-type-regle" class="text-encre-2 mt-3 mb-2 block text-[0.8rem] font-semibold">{{
      textes.typeTransaction
    }}</span>
    <si-choix-bascules
      [choix]="textes.choixTypes"
      [valeur]="type()"
      [libelle]="textes.typeTransaction"
      (choisir)="type.set($any($event))"
    />
    <div class="mt-4 grid gap-4 sm:grid-cols-3">
      <div>
        <label hlmLabel for="f-taux" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
          textes.labelTaux
        }}</label>
        <input
          hlmInput
          id="f-taux"
          inputmode="decimal"
          class="h-11 w-full bg-white tabular-nums"
          [value]="taux()"
          [attr.aria-invalid]="tauxInvalide()"
          (input)="taux.set($any($event.target).value)"
        />
      </div>
      <div>
        <label
          hlmLabel
          for="f-minimum"
          class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.labelMinimum }}</label
        >
        <input
          hlmInput
          id="f-minimum"
          inputmode="numeric"
          class="h-11 w-full bg-white tabular-nums"
          [value]="minimumLisible()"
          (input)="saisirMinimum($any($event.target))"
        />
      </div>
      <div>
        <label
          hlmLabel
          for="f-date-effet"
          class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.labelDate }}</label
        >
        <input
          hlmInput
          id="f-date-effet"
          type="date"
          class="h-11 w-full bg-white"
          [min]="aujourdhui"
          [value]="date()"
          (change)="date.set($any($event.target).value)"
        />
      </div>
    </div>
    @if (tauxInvalide()) {
      <p class="text-destructive mt-2 text-[0.85rem]" role="alert">{{ textes.tauxInvalide }}</p>
    }
    <div class="mt-5 flex flex-wrap items-center gap-4">
      <button
        hlmBtn
        size="grand"
        class="h-11"
        [disabled]="enCours() || !valide()"
        (click)="envoyer()"
      >
        {{ textes.enregistrer }}
      </button>
      <button type="button" class="lien-texte" (click)="fermer.emit()">{{ textes.fermer }}</button>
    </div>
    @if (erreur(); as e) {
      <p class="text-destructive mt-3 text-[0.85rem]" role="alert">{{ e }}</p>
    }
  `,
  host: { class: 'block rounded-cadre border border-ciel bg-brume p-[18px]' },
})
export class FormulaireRegle {
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly ajouter = output<NouvelleRegle>();
  readonly fermer = output<void>();

  protected readonly textes = TEXTES_COMMISSIONS;
  protected readonly aujourdhui = aujourdhuiIso();
  protected readonly type = signal<TypeTransaction>('location');
  protected readonly taux = signal('');
  protected readonly minimum = signal(0);
  protected readonly date = signal(this.aujourdhui);

  private readonly tauxNombre = computed(() => Number(this.taux().replace(',', '.')));
  protected readonly tauxInvalide = computed(() => {
    const t = this.tauxNombre();
    return this.taux() !== '' && (Number.isNaN(t) || t < 0 || t > TAUX_MAX);
  });
  protected readonly minimumLisible = computed(() =>
    this.minimum() ? nombre(this.minimum()) : '',
  );
  protected readonly valide = computed(
    () => this.taux() !== '' && !this.tauxInvalide() && this.date() >= this.aujourdhui,
  );

  protected saisirMinimum(champ: HTMLInputElement): void {
    this.minimum.set(lireMontant(champ.value));
    champ.value = this.minimumLisible();
  }

  protected envoyer(): void {
    this.ajouter.emit({
      type_transaction: this.type(),
      taux: this.tauxNombre(),
      montant_minimum: this.minimum(),
      actif_depuis: this.date(),
    });
  }
}
