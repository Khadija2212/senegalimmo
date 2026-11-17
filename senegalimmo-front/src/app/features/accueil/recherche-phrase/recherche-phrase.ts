import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { fcfa, lireMontant, nombre } from '../../../core/format/fcfa';
import { TypeBien, TypeTransaction } from '../../../core/modeles/annonce';
import { CriteresPlus } from '../criteres-plus/criteres-plus';
import { Lieu, TYPES_BIEN, libelleType, trouverLieu } from '../donnees';
import { RechercheAccueil } from '../recherche-accueil';
import { ChampLieu } from './champ-lieu';
import { TEXTES_ACCUEIL } from '../textes';

/** Recherche en phrase : « Je veux louer un appartement à Dakar pour 400 000 FCFA par mois. » */
@Component({
  selector: 'si-recherche-phrase',
  imports: [NgIcon, HlmButton, HlmInput, HlmSelectImports, CriteresPlus, ChampLieu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recherche-phrase.html',
})
export class RecherchePhrase {
  readonly voir = output<void>();
  protected readonly recherche = inject(RechercheAccueil);
  protected readonly textes = TEXTES_ACCUEIL;
  protected readonly types = TYPES_BIEN;
  protected readonly plusOuvert = signal(false);
  protected readonly positionRefusee = signal(false);

  protected readonly c = this.recherche.criteres;
  protected readonly enVente = computed(() => this.c().type_transaction === 'vente');
  protected readonly type = computed(() => libelleType(this.c().type));
  protected readonly lieu = computed(
    () => this.c().quartier ?? this.c().ville ?? (this.c().lat ? this.textes.autourDeVous : ''),
  );
  protected readonly preposition = computed(() =>
    this.c().lat ? '' : (trouverLieu(this.lieu())?.preposition ?? 'à'),
  );
  protected readonly budget = computed(() =>
    this.c().prix_max ? nombre(this.c().prix_max as number) : '',
  );
  protected readonly libelleTransaction = (v: TypeTransaction): string =>
    v === 'vente' ? this.textes.acheter : this.textes.louer;
  protected readonly libelleTypeBien = (v: TypeBien): string => libelleType(v).singulier;

  protected readonly boutonTexte = computed(() => {
    const n = this.recherche.total();
    if (this.recherche.etat() === 'pret' && n === 0) return this.textes.aucune;
    return n === 1 ? this.textes.voirUne : `${this.textes.voir} ${n} ${this.textes.resultats}`;
  });

  protected readonly apercu = computed(() => {
    const { verifiees, prix_min } = this.recherche.resume();
    if (this.recherche.total() === 0 || prix_min === null) return null;
    const mot = verifiees > 1 ? this.textes.verifiees : this.textes.verifiee;
    return {
      verifiees,
      mot,
      total: this.recherche.total(),
      prix: fcfa(prix_min),
      parMois: !this.enVente(),
    };
  });

  protected changerLieu(l: Lieu): void {
    this.recherche.modifier(
      l.estVille
        ? { ville: l.nom, quartier: undefined, lat: undefined, lng: undefined }
        : { quartier: l.nom, ville: undefined, lat: undefined, lng: undefined },
    );
  }

  protected saisirLieu(texte: string): void {
    const l = trouverLieu(texte);
    if (l) this.changerLieu(l);
  }

  protected saisirBudget(champ: HTMLInputElement): void {
    const montant = lireMontant(champ.value);
    champ.value = montant ? nombre(montant) : '';
    this.recherche.modifier({ prix_max: montant || undefined });
  }

  protected autourDeMoi(): void {
    this.positionRefusee.set(false);
    navigator.geolocation?.getCurrentPosition(
      (p) =>
        this.recherche.modifier({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          ville: undefined,
          quartier: undefined,
        }),
      () => this.positionRefusee.set(true),
    );
  }
}
