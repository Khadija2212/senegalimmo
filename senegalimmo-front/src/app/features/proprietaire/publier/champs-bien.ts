import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { TypeBien } from '../../../core/modeles/annonce';
import { Champ } from './champ';
import { FormulaireBien } from './formulaire';
import { LONGUEURS } from './regles-vue';
import { TEXTES_PUBLIER, TYPES_BIEN } from './textes';

const CHAMP = 'h-11 w-full bg-white';

/** Première étape : la description du bien (POST /api/biens). */
@Component({
  selector: 'si-champs-bien',
  imports: [
    ReactiveFormsModule,
    HlmInput,
    HlmSelectImports,
    HlmTextarea,
    HlmToggleGroupImports,
    Champ,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div [formGroup]="form()" class="grid gap-x-3 gap-y-5 sm:grid-cols-6">
      <si-champ
        class="sm:col-span-6"
        ident="b-titre"
        [libelle]="t.titreBien"
        [controle]="form().controls.titre"
      >
        <input
          hlmInput
          id="b-titre"
          [class]="champ"
          formControlName="titre"
          [maxlength]="max.titre"
          [placeholder]="t.titrePlaceholder"
        />
      </si-champ>
      <si-champ
        class="sm:col-span-3"
        ident="b-type"
        [groupe]="true"
        [libelle]="t.typeBien"
        [controle]="form().controls.type"
      >
        <hlm-select formControlName="type" [itemToString]="libelleType">
          <hlm-select-trigger aria-labelledby="b-type-l" [class]="champ"
            ><hlm-select-value [placeholder]="t.choisirType"
          /></hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            @for (ty of types; track ty.valeur) {
              <hlm-select-item [value]="ty.valeur">{{ ty.libelle }}</hlm-select-item>
            }
          </hlm-select-content>
        </hlm-select>
      </si-champ>
      <si-champ
        class="sm:col-span-3"
        ident="b-meuble"
        [groupe]="true"
        [libelle]="t.meuble"
        [controle]="form().controls.meuble"
      >
        <hlm-toggle-group
          type="single"
          variant="case"
          [spacing]="1.5"
          formControlName="meuble"
          aria-labelledby="b-meuble-l"
        >
          <button hlmToggleGroupItem [value]="false" class="h-11 px-4">{{ t.meubleNon }}</button>
          <button hlmToggleGroupItem [value]="true" class="h-11 px-4">{{ t.meubleOui }}</button>
        </hlm-toggle-group>
      </si-champ>
      <si-champ
        class="sm:col-span-2"
        ident="b-surface"
        [libelle]="t.surface"
        [controle]="form().controls.surface"
      >
        <input
          hlmInput
          id="b-surface"
          type="number"
          min="0"
          step="any"
          inputmode="decimal"
          [class]="champ + ' tabular-nums'"
          formControlName="surface"
        />
      </si-champ>
      <si-champ
        class="sm:col-span-2"
        ident="b-pieces"
        [libelle]="t.pieces"
        [controle]="form().controls.nombre_pieces"
      >
        <input
          hlmInput
          id="b-pieces"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          [class]="champ + ' tabular-nums'"
          formControlName="nombre_pieces"
        />
      </si-champ>
      <si-champ
        class="sm:col-span-2"
        ident="b-chambres"
        [libelle]="t.chambres"
        [controle]="form().controls.nombre_chambres"
      >
        <input
          hlmInput
          id="b-chambres"
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          [class]="champ + ' tabular-nums'"
          formControlName="nombre_chambres"
        />
      </si-champ>
      <si-champ
        class="sm:col-span-6"
        ident="b-adresse"
        [libelle]="t.adresse"
        [controle]="form().controls.adresse"
      >
        <input
          hlmInput
          id="b-adresse"
          autocomplete="street-address"
          [class]="champ"
          formControlName="adresse"
          [maxlength]="max.adresse"
          [placeholder]="t.adressePlaceholder"
        />
      </si-champ>
      <si-champ
        class="sm:col-span-3"
        ident="b-quartier"
        [libelle]="t.quartier"
        [controle]="form().controls.quartier"
      >
        <input
          hlmInput
          id="b-quartier"
          [class]="champ"
          formControlName="quartier"
          [maxlength]="max.quartier"
        />
      </si-champ>
      <si-champ
        class="sm:col-span-3"
        ident="b-ville"
        [libelle]="t.ville"
        [controle]="form().controls.ville"
      >
        <input
          hlmInput
          id="b-ville"
          autocomplete="address-level2"
          [class]="champ"
          formControlName="ville"
          [maxlength]="max.ville"
        />
      </si-champ>
      <si-champ
        class="sm:col-span-6"
        ident="b-description"
        [libelle]="t.description"
        [controle]="form().controls.description"
      >
        <textarea
          hlmTextarea
          id="b-description"
          rows="6"
          class="w-full bg-white"
          formControlName="description"
          [maxlength]="max.description"
          [placeholder]="t.descriptionPlaceholder"
        ></textarea>
      </si-champ>
    </div>
  `,
})
export class ChampsBien {
  readonly form = input.required<FormulaireBien>();
  protected readonly t = TEXTES_PUBLIER;
  protected readonly types = TYPES_BIEN;
  protected readonly max = LONGUEURS;
  protected readonly champ = CHAMP;
  protected readonly libelleType = (v: TypeBien): string =>
    TYPES_BIEN.find((ty) => ty.valeur === v)?.libelle ?? '';
}
