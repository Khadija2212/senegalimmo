import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { HEURES, dateHeure, prochainsJours } from '../../core/format/creneaux';
import { TEXTES_ESPACE } from './textes';

const JOUR_DEFAUT = 1;
const HEURE_DEFAUT = 1;

/** Cas « Reprogrammer une visite » : le client propose un autre créneau, à reconfirmer. */
@Component({
  selector: 'si-reprogrammer-visite',
  imports: [HlmButton, HlmToggleGroupImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  template: `
    <span [id]="ident() + '-jour'" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
      textes.nouveauJour
    }}</span>
    <hlm-toggle-group
      type="single"
      variant="case"
      [spacing]="1.5"
      [attr.aria-labelledby]="ident() + '-jour'"
      class="grid w-full max-w-[460px] grid-cols-5"
      [value]="jour()"
      (valueChange)="jour.set($any($event) ?? jour())"
    >
      @for (j of jours; track j.valeur) {
        <button
          hlmToggleGroupItem
          [value]="j.valeur"
          class="h-auto flex-col gap-0 bg-white px-1 py-2 text-[0.85rem]"
        >
          {{ j.nomCourt }}<small class="text-encre-3 text-[0.74rem]">{{ j.date }}</small>
        </button>
      }
    </hlm-toggle-group>

    <span
      [id]="ident() + '-heure'"
      class="text-encre-2 mt-3.5 mb-2 block text-[0.8rem] font-semibold"
      >{{ textes.heure }}</span
    >
    <hlm-toggle-group
      type="single"
      variant="case"
      [spacing]="1.5"
      [attr.aria-labelledby]="ident() + '-heure'"
      class="grid w-full max-w-[560px] grid-cols-3 sm:grid-cols-6"
      [value]="heure()"
      (valueChange)="heure.set($any($event) ?? heure())"
    >
      @for (h of heures; track h.valeur) {
        <button hlmToggleGroupItem [value]="h.valeur" class="bg-white text-[0.85rem]">
          {{ h.libelle }}
        </button>
      }
    </hlm-toggle-group>

    <div class="mt-4 flex flex-wrap items-center gap-4">
      <button
        hlmBtn
        size="grand"
        class="h-11"
        [disabled]="enCours()"
        (click)="valider.emit(choix())"
      >
        {{ libelle() }}
      </button>
      <button type="button" class="lien-texte" (click)="fermer.emit()">
        {{ textes.garderDate }}
      </button>
    </div>
    <p class="text-encre-3 mt-2.5 text-[0.82rem]">{{ textes.noteReprog(qui()) }}</p>
  `,
  host: { class: 'block rounded-cadre border border-ciel bg-brume p-[18px]' },
})
export class ReprogrammerVisite {
  readonly ident = input.required<string>();
  readonly qui = input.required<string>();
  readonly enCours = input(false);
  readonly valider = output<string>();
  readonly fermer = output<void>();
  protected readonly textes = TEXTES_ESPACE;
  protected readonly jours = prochainsJours();
  protected readonly heures = HEURES;
  protected readonly jour = signal(this.jours[JOUR_DEFAUT].valeur);
  protected readonly heure = signal(HEURES[HEURE_DEFAUT].valeur);

  private readonly choixJour = computed(
    () => this.jours.find((j) => j.valeur === this.jour()) ?? this.jours[0],
  );
  private readonly choixHeure = computed(
    () => HEURES.find((h) => h.valeur === this.heure()) ?? HEURES[0],
  );
  protected readonly libelle = computed(() =>
    this.textes.proposer(
      `${this.choixJour().nomCourt} ${this.choixJour().date}`,
      this.choixHeure().libelle,
    ),
  );
  protected readonly choix = computed(() => dateHeure(this.jour(), this.heure()));
}
