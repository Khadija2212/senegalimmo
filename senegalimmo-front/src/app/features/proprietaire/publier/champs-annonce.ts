import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { startWith, switchMap } from 'rxjs';
import { Champ } from './champ';
import { FormulaireAnnonce } from './formulaire';
import { TEXTES_PUBLIER } from './textes';

const CHAMP = 'h-11 w-full bg-white tabular-nums';

/** Deuxième étape : location ou vente, prix, charges et caution (POST /api/mes-annonces). */
@Component({
  selector: 'si-champs-annonce',
  imports: [ReactiveFormsModule, HlmInput, HlmToggleGroupImports, Champ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div [formGroup]="form()" class="grid gap-x-3 gap-y-5 sm:grid-cols-3">
      <si-champ
        class="sm:col-span-3"
        ident="a-transaction"
        [groupe]="true"
        [libelle]="t.transaction"
        [controle]="form().controls.type_transaction"
      >
        <hlm-toggle-group
          type="single"
          variant="case"
          [spacing]="1.5"
          formControlName="type_transaction"
          aria-labelledby="a-transaction-l"
        >
          <button hlmToggleGroupItem value="location" class="h-11 px-4">{{ t.location }}</button>
          <button hlmToggleGroupItem value="vente" class="h-11 px-4">{{ t.vente }}</button>
        </hlm-toggle-group>
      </si-champ>
      <si-champ
        ident="a-prix"
        [libelle]="location() ? t.loyer : t.prixVente"
        [controle]="form().controls.prix"
      >
        <input
          hlmInput
          id="a-prix"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          [class]="champ"
          formControlName="prix"
        />
      </si-champ>
      @if (location()) {
        <si-champ ident="a-charges" [libelle]="t.charges" [controle]="form().controls.charges">
          <input
            hlmInput
            id="a-charges"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            [class]="champ"
            formControlName="charges"
          />
        </si-champ>
        <si-champ
          ident="a-caution"
          [libelle]="t.caution"
          [note]="t.noteCaution"
          [controle]="form().controls.caution"
        >
          <input
            hlmInput
            id="a-caution"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            [class]="champ"
            formControlName="caution"
          />
        </si-champ>
      }
    </div>
  `,
})
export class ChampsAnnonce {
  readonly form = input.required<FormulaireAnnonce>();
  protected readonly t = TEXTES_PUBLIER;
  protected readonly champ = CHAMP;

  private readonly transaction = toSignal(
    toObservable(this.form).pipe(
      switchMap((f) =>
        f.controls.type_transaction.valueChanges.pipe(startWith(f.controls.type_transaction.value)),
      ),
    ),
  );
  protected readonly location = computed(() => this.transaction() !== 'vente');
}
