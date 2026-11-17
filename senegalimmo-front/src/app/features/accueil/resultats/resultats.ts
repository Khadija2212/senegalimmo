import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { fcfaCourt } from '../../../core/format/fcfa';
import { Tri } from '../../../core/modeles/annonce';
import { CarteMapbox, Repere } from '../../../shared/carte/carte-mapbox';
import { CENTRE_DAKAR } from '../../../shared/carte/style-carte';
import { libelleType, trouverLieu } from '../donnees';
import { FicheAnnonce } from '../fiche-annonce/fiche-annonce';
import { RechercheAccueil } from '../recherche-accueil';
import { TEXTES_ACCUEIL } from '../textes';

const NOMBRE_SQUELETTES = 3;
const ZOOM_QUARTIER = 13.4;
const ZOOM_VILLE = 12.4;

/** Résultats de la recherche : fiches et carte côte à côte, liste ou carte sur téléphone. */
@Component({
  selector: 'si-resultats',
  imports: [NgIcon, HlmButton, HlmSelectImports, FicheAnnonce, CarteMapbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resultats.html',
})
export class Resultats {
  protected readonly recherche = inject(RechercheAccueil);
  private readonly router = inject(Router);
  protected readonly textes = TEXTES_ACCUEIL;
  protected readonly squelettes = Array.from({ length: NOMBRE_SQUELETTES }, (_, i) => i);
  protected readonly vue = signal<'liste' | 'carte'>('liste');
  private readonly carte = viewChild(CarteMapbox);
  protected readonly libelleTri = (t: Tri): string => this.textes.tris[t];

  protected readonly titre = computed(() => {
    const c = this.recherche.criteres();
    const action = c.type_transaction === 'vente' ? this.textes.aVendre : this.textes.aLouer;
    const lieu = c.lat ? this.textes.autourDeVous : (c.quartier ?? c.ville ?? this.textes.partout);
    return `${libelleType(c.type).pluriel} ${action}, ${lieu}`;
  });

  protected readonly centre = computed<[number, number]>(() => {
    const c = this.recherche.criteres();
    if (c.lat && c.lng) return [c.lng, c.lat];
    return trouverLieu(c.quartier ?? c.ville)?.centre ?? CENTRE_DAKAR;
  });

  protected readonly zoom = computed(() =>
    this.recherche.criteres().quartier || this.recherche.criteres().lat
      ? ZOOM_QUARTIER
      : ZOOM_VILLE,
  );

  protected readonly reperes = computed<Repere[]>(() =>
    this.recherche
      .points()
      .map((p) => ({
        id: p.id,
        lng: p.longitude,
        lat: p.latitude,
        texte: fcfaCourt(p.prix + p.charges),
      })),
  );

  protected montrer(vue: 'liste' | 'carte'): void {
    this.vue.set(vue);
    if (vue === 'carte') requestAnimationFrame(() => this.carte()?.redimensionner());
  }

  protected ouvrir(id: string): void {
    this.router.navigate(['/annonces', id]);
  }
}
