import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  OnDestroy,
  afterNextRender,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { ENVIRONNEMENT } from '../../core/config/environnement';
import { STYLE_CARTE, TEXTES_CARTE } from './style-carte';

const MARGE_CADRAGE = 60;
const ZOOM_CADRAGE_MAX = 14;

export interface Repere {
  id: string;
  lng: number;
  lat: number;
  /** Sans texte, le repère est un simple point. */
  texte?: string;
}

/** Carte du cas « Afficher sur la carte » (acteur système Mapbox). */
@Component({
  selector: 'si-carte-mapbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #conteneur class="size-full"></div>
    @if (!jeton) {
      <p
        class="bg-brume text-encre-2 absolute inset-0 grid place-items-center p-6 text-center text-sm"
      >
        {{ textes.sansCle }}
      </p>
    }
  `,
  styleUrl: './carte-mapbox.css',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'relative block overflow-hidden' },
})
export class CarteMapbox implements OnDestroy {
  readonly centre = input.required<[number, number]>();
  readonly zoom = input(12.4);
  readonly reperes = input<Repere[]>([]);
  /** Cadre la carte sur les repères dès qu'il y en a plusieurs. */
  readonly cadrer = input(false);
  readonly choisi = output<string>();

  protected readonly jeton = ENVIRONNEMENT.mapboxJeton;
  protected readonly textes = TEXTES_CARTE;
  private readonly conteneur = viewChild.required<ElementRef<HTMLDivElement>>('conteneur');
  private carte: mapboxgl.Map | null = null;
  private marqueurs: mapboxgl.Marker[] = [];

  constructor() {
    afterNextRender(() => this.creer());
    effect(() => this.poser(this.reperes()));
    effect(() => this.carte?.jumpTo({ center: this.centre(), zoom: this.zoom() }));
  }

  /** À appeler quand la carte redevient visible (bascule liste et carte sur téléphone). */
  redimensionner(): void {
    this.carte?.resize();
  }

  ngOnDestroy(): void {
    this.carte?.remove();
  }

  private creer(): void {
    if (!this.jeton) return;
    chargerFeuilleMapbox();
    this.carte = new mapboxgl.Map({
      accessToken: this.jeton,
      container: this.conteneur().nativeElement,
      style: STYLE_CARTE.style,
      config: STYLE_CARTE.config,
      center: this.centre(),
      zoom: this.zoom(),
      cooperativeGestures: true,
    } as mapboxgl.MapOptions);
    this.carte.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    this.poser(this.reperes());
  }

  private poser(reperes: Repere[]): void {
    const carte = this.carte;
    if (!carte) return;
    this.marqueurs.forEach((m) => m.remove());
    this.marqueurs = reperes.map((r) =>
      new mapboxgl.Marker({ element: this.element(r), anchor: 'bottom' })
        .setLngLat([r.lng, r.lat])
        .addTo(carte),
    );
    if (this.cadrer() && reperes.length > 1) {
      const limites = new mapboxgl.LngLatBounds();
      reperes.forEach((r) => limites.extend([r.lng, r.lat]));
      carte.fitBounds(limites, { padding: MARGE_CADRAGE, maxZoom: ZOOM_CADRAGE_MAX, duration: 0 });
    }
  }

  private element(r: Repere): HTMLElement {
    const el = document.createElement(r.texte ? 'button' : 'span');
    el.className = r.texte ? 'si-repere' : 'si-repere si-repere-point';
    el.textContent = r.texte ?? '';
    if (r.texte) el.addEventListener('click', () => this.choisi.emit(r.id));
    return el;
  }
}

const FEUILLE_MAPBOX = 'mapbox.css';

/** La feuille de Mapbox est un fichier à part (angular.json), ajouté à la page au premier affichage d'une carte. */
function chargerFeuilleMapbox(): void {
  if (document.querySelector(`link[href="${FEUILLE_MAPBOX}"]`)) return;
  const lien = document.createElement('link');
  lien.rel = 'stylesheet';
  lien.href = FEUILLE_MAPBOX;
  document.head.appendChild(lien);
}
