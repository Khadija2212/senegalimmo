import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { lireMontant, nombre } from '../../core/format/fcfa';
import { NouvelleAnnonce } from '../../core/modeles/agent';
import { TypeTransaction } from '../../core/modeles/annonce';
import { TEXTES_AGENT } from './textes';

type Champ = 'prix' | 'charges' | 'caution';
export type SaisieAnnonce = Omit<NouvelleAnnonce, 'bien_id'>;

const TYPES: readonly TypeTransaction[] = ['location', 'vente'];

/** Cas « Publier annonce » sur un bien assigné : l'annonce part en modération. */
@Component({
  selector: 'si-formulaire-annonce',
  imports: [HlmButton, HlmInput, HlmLabel, HlmToggleGroupImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  template: `
    <span [id]="ident() + '-type'" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
      textes.typeTransaction
    }}</span>
    <hlm-toggle-group
      type="single"
      variant="case"
      [spacing]="1.5"
      [attr.aria-labelledby]="ident() + '-type'"
      class="grid w-full max-w-[280px] grid-cols-2"
      [value]="type()"
      (valueChange)="type.set($any($event) ?? type())"
    >
      @for (t of types; track t) {
        <button hlmToggleGroupItem [value]="t" class="bg-white text-[0.85rem]">
          {{ textes[t] }}
        </button>
      }
    </hlm-toggle-group>

    <div class="mt-3.5 grid gap-3.5 sm:grid-cols-3">
      @for (c of champs(); track c.cle) {
        <div class="min-w-0">
          <label
            hlmLabel
            [for]="ident() + '-' + c.cle"
            class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
            >{{ c.libelle }}</label
          >
          <input
            hlmInput
            [id]="ident() + '-' + c.cle"
            inputmode="numeric"
            class="h-11 w-full bg-white tabular-nums"
            [value]="affiche(c.cle)"
            (input)="saisir(c.cle, $any($event.target))"
          />
        </div>
      }
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-4">
      <button
        hlmBtn
        size="grand"
        class="h-11"
        [disabled]="enCours() || !montants().prix"
        (click)="valider.emit(saisie())"
      >
        {{ enCours() ? textes.envoiEnCours : textes.envoyerModeration }}
      </button>
      <button type="button" class="lien-texte" (click)="fermer.emit()">{{ textes.fermer }}</button>
    </div>
    <p class="text-encre-3 mt-2.5 text-[0.82rem]">{{ textes.noteAnnonce }}</p>
  `,
  host: { class: 'block rounded-cadre border border-ciel bg-brume p-[18px]' },
})
export class FormulaireAnnonce {
  readonly ident = input.required<string>();
  readonly enCours = input(false);
  readonly valider = output<SaisieAnnonce>();
  readonly fermer = output<void>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly types = TYPES;
  protected readonly type = signal<TypeTransaction>('location');
  protected readonly montants = signal<Record<Champ, number>>({ prix: 0, charges: 0, caution: 0 });

  /** Une vente n'a ni charges mensuelles ni caution. */
  protected readonly champs = computed(() =>
    this.type() === 'vente'
      ? [{ cle: 'prix' as const, libelle: this.textes.prixVente }]
      : [
          { cle: 'prix' as const, libelle: this.textes.prixLocation },
          { cle: 'charges' as const, libelle: this.textes.charges },
          { cle: 'caution' as const, libelle: this.textes.caution },
        ],
  );
  protected readonly saisie = computed<SaisieAnnonce>(() => {
    const m = this.montants();
    const location = this.type() === 'location';
    return {
      type_transaction: this.type(),
      prix: m.prix,
      charges: location ? m.charges : 0,
      caution: location ? m.caution : 0,
    };
  });

  protected affiche(c: Champ): string {
    const n = this.montants()[c];
    return n ? nombre(n) : '';
  }

  protected saisir(c: Champ, champ: HTMLInputElement): void {
    this.montants.update((m) => ({ ...m, [c]: lireMontant(champ.value) }));
    champ.value = this.affiche(c);
  }
}
