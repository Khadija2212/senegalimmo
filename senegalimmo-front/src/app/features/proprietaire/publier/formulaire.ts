import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { TypeBien, TypeTransaction } from '../../../core/modeles/annonce';
import { NouveauBien } from '../../../core/modeles/proprietaire';
import { LONGUEURS, messageRegle, verifierNombre } from './regles-vue';
import { TEXTES_PUBLIER } from './textes';

function nombre(regle: Parameters<typeof verifierNombre>[1]): ValidatorFn {
  return (c) => {
    const code = verifierNombre(c.value, regle);
    return code ? { [code]: true } : null;
  };
}

function texte(max: number, requis = true): ValidatorFn[] {
  return [...(requis ? [Validators.required] : []), Validators.maxLength(max)];
}

const ENTIER_POSITIF = nombre({ entier: true, min: 0, strict: true });
const ENTIER_OU_ZERO = nombre({ entier: true, min: 0 });

export function formulaireBien(): FormGroup<{
  titre: FormControl<string>;
  type: FormControl<TypeBien | null>;
  surface: FormControl<number | null>;
  nombre_pieces: FormControl<number | null>;
  nombre_chambres: FormControl<number | null>;
  meuble: FormControl<boolean>;
  adresse: FormControl<string>;
  quartier: FormControl<string>;
  ville: FormControl<string>;
  description: FormControl<string>;
}> {
  const req = Validators.required;
  return new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: texte(LONGUEURS.titre) }),
    type: new FormControl<TypeBien | null>(null, { validators: [req] }),
    surface: new FormControl<number | null>(null, {
      validators: [req, nombre({ min: 0, strict: true })],
    }),
    nombre_pieces: new FormControl<number | null>(null, {
      validators: [req, nombre({ entier: true, min: 1 })],
    }),
    nombre_chambres: new FormControl<number | null>(null, { validators: [req, ENTIER_OU_ZERO] }),
    meuble: new FormControl(false, { nonNullable: true }),
    adresse: new FormControl('', { nonNullable: true, validators: texte(LONGUEURS.adresse) }),
    quartier: new FormControl('', { nonNullable: true, validators: texte(LONGUEURS.quartier) }),
    ville: new FormControl<string>(TEXTES_PUBLIER.villeParDefaut, {
      nonNullable: true,
      validators: texte(LONGUEURS.ville),
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: texte(LONGUEURS.description),
    }),
  });
}

export function formulaireAnnonce(): FormGroup<{
  type_transaction: FormControl<TypeTransaction>;
  prix: FormControl<number | null>;
  charges: FormControl<number | null>;
  caution: FormControl<number | null>;
}> {
  return new FormGroup({
    type_transaction: new FormControl<TypeTransaction>('location', { nonNullable: true }),
    prix: new FormControl<number | null>(null, {
      validators: [Validators.required, ENTIER_POSITIF],
    }),
    charges: new FormControl<number | null>(null, { validators: [ENTIER_OU_ZERO] }),
    caution: new FormControl<number | null>(null, { validators: [ENTIER_OU_ZERO] }),
  });
}

export type FormulaireBien = ReturnType<typeof formulaireBien>;
export type FormulaireAnnonce = ReturnType<typeof formulaireAnnonce>;

/** Valeurs du bien prêtes pour POST /api/biens, une fois le formulaire valide. */
export function valeursBien(f: FormulaireBien): NouveauBien {
  const v = f.getRawValue();
  return {
    titre: v.titre.trim(),
    description: v.description.trim(),
    type: v.type as TypeBien,
    surface: Number(v.surface),
    nombre_pieces: Number(v.nombre_pieces),
    nombre_chambres: Number(v.nombre_chambres),
    meuble: v.meuble,
    adresse: v.adresse.trim(),
    quartier: v.quartier.trim(),
    ville: v.ville.trim(),
  };
}

/** Message sous un champ, seulement après une sortie du champ ou une tentative d'envoi. */
export function messageChamp(c: AbstractControl): string | null {
  return c.touched ? messageRegle(c.errors) : null;
}
