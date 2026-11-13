import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_CONFIG } from '../../config/mapbox.config';
import { MapboxService } from '../../services/mapbox.service';

const FALLBACK_LIGHT_STYLE: any = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const FALLBACK_DARK_STYLE: any = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

@Component({
  selector: 'app-mapbox-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapbox-map.html',
  styleUrl: './mapbox-map.css',
})
export class MapboxMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  @Input() mode: 'picker' | 'view' | 'explorer' = 'view';
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() biens: any[] = [];
  @Input() userPosition: { latitude: number; longitude: number } | null = null;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() height = '340px';

  @Output() coordinatesChange = new EventEmitter<{ latitude: number; longitude: number }>();
  @Output() selectBien = new EventEmitter<number>();

  tokenInput = '';
  mapError = '';

  private map: mapboxgl.Map | null = null;
  private singleMarker: mapboxgl.Marker | null = null;
  private explorerMarkers: mapboxgl.Marker[] = [];
  private userMarker: mapboxgl.Marker | null = null;
  private viewInitialized = false;

  constructor(
    private mapboxService: MapboxService,
    private cdr: ChangeDetectorRef
  ) {}

  get hasToken(): boolean {
    return this.mapboxService.hasToken();
  }

  get hasValidSingleCoords(): boolean {
    if (
      this.latitude === null ||
      this.latitude === undefined ||
      this.longitude === null ||
      this.longitude === undefined ||
      String(this.latitude).trim() === '' ||
      String(this.longitude).trim() === ''
    ) {
      return false;
    }
    const lat = Number(this.latitude);
    const lng = Number(this.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.scheduleInit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewInitialized) {
      return;
    }

    if (changes['theme'] && this.map) {
      this.map.setStyle(
        this.theme === 'dark' ? MAPBOX_CONFIG.styles.dark : MAPBOX_CONFIG.styles.streets
      );
    }

    if (!this.map) {
      this.scheduleInit();
      return;
    }

    if (this.mode === 'view' && (changes['latitude'] || changes['longitude'])) {
      this.syncSingleMarker(true);
    }

    if (this.mode === 'picker' && (changes['latitude'] || changes['longitude'])) {
      this.syncSingleMarker(true);
    }

    if (this.mode === 'explorer' && (changes['biens'] || changes['userPosition'])) {
      this.syncExplorerMarkers();
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  applyRuntimeToken(): void {
    const trimmed = this.tokenInput.trim();
    if (!trimmed) {
      return;
    }
    this.mapboxService.setRuntimeToken(trimmed);
    this.mapError = '';
    this.cdr.detectChanges();
    this.scheduleInit();
  }

  private scheduleInit(): void {
    setTimeout(() => {
      if (!this.hasToken || !this.mapContainer?.nativeElement) {
        return;
      }
      if (this.mode === 'view' && !this.hasValidSingleCoords) {
        this.destroyMap();
        return;
      }
      if (!this.map) {
        this.initMap();
      }
    });
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) {
      return;
    }

    const token = this.mapboxService.getAccessToken();
    (mapboxgl as any).accessToken = token;

    const initialCenter: [number, number] = this.hasValidSingleCoords
      ? [Number(this.longitude), Number(this.latitude)]
      : MAPBOX_CONFIG.defaultCenter;

    const style =
      this.theme === 'dark' ? MAPBOX_CONFIG.styles.dark : MAPBOX_CONFIG.styles.streets;

    try {
      this.map = new mapboxgl.Map({
        container: this.mapContainer.nativeElement,
        style,
        center: initialCenter,
        zoom: this.hasValidSingleCoords ? 14 : MAPBOX_CONFIG.defaultZoom,
        accessToken: token,
      });

      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      let fallbackApplied = false;
      this.map.on('error', (e: any) => {
        const msg = String(e?.error?.message ?? '');
        const status = e?.error?.status;
        if (!fallbackApplied && (status === 401 || status === 403 || msg.toLowerCase().includes('token') || msg.toLowerCase().includes('forbidden'))) {
          fallbackApplied = true;
          this.map?.setStyle(this.theme === 'dark' ? FALLBACK_DARK_STYLE : FALLBACK_LIGHT_STYLE);
          this.mapError = '';
          this.cdr.detectChanges();
        }
      });

      this.map.on('load', () => {
        this.map?.resize();
      });

      if (this.mode === 'picker') {
        this.syncSingleMarker(false);
        this.map.on('click', (event) => {
          const lat = Number(event.lngLat.lat.toFixed(6));
          const lng = Number(event.lngLat.lng.toFixed(6));
          this.placePickerMarker(lng, lat);
          this.coordinatesChange.emit({ latitude: lat, longitude: lng });
        });
      } else if (this.mode === 'view') {
        this.syncSingleMarker(true);
      } else if (this.mode === 'explorer') {
        this.syncExplorerMarkers();
      }
    } catch {
      this.mapError = 'Impossible d’initialiser la carte Mapbox.';
      this.cdr.detectChanges();
    }
  }

  private placePickerMarker(lng: number, lat: number): void {
    if (!this.map) {
      return;
    }

    if (!this.singleMarker) {
      this.singleMarker = new mapboxgl.Marker({
        color: '#184e3b',
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(this.map);

      this.singleMarker.on('dragend', () => {
        const pos = this.singleMarker?.getLngLat();
        if (!pos) return;
        this.coordinatesChange.emit({
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6)),
        });
      });
    } else {
      this.singleMarker.setLngLat([lng, lat]);
    }
  }

  private syncSingleMarker(centerMap: boolean): void {
    if (!this.map) {
      return;
    }

    if (!this.hasValidSingleCoords) {
      this.singleMarker?.remove();
      this.singleMarker = null;
      return;
    }

    const lat = Number(this.latitude);
    const lng = Number(this.longitude);

    if (this.mode === 'picker') {
      this.placePickerMarker(lng, lat);
    } else {
      if (!this.singleMarker) {
        this.singleMarker = new mapboxgl.Marker({ color: '#184e3b' })
          .setLngLat([lng, lat])
          .addTo(this.map);

        if (this.title || this.subtitle) {
          const popupEl = document.createElement('div');
          popupEl.className = 'mbx-popup-card';
          if (this.title) {
            const h4 = document.createElement('h4');
            h4.className = 'mbx-popup-title';
            h4.textContent = this.title;
            popupEl.appendChild(h4);
          }
          if (this.subtitle) {
            const p = document.createElement('p');
            p.className = 'mbx-popup-loc';
            p.textContent = this.subtitle;
            popupEl.appendChild(p);
          }
          this.singleMarker.setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupEl));
        }
      } else {
        this.singleMarker.setLngLat([lng, lat]);
      }
    }

    if (centerMap) {
      this.map.flyTo({ center: [lng, lat], zoom: 14, essential: true });
    }
  }

  private syncExplorerMarkers(): void {
    if (!this.map) {
      return;
    }

    this.explorerMarkers.forEach((m) => m.remove());
    this.explorerMarkers = [];
    this.userMarker?.remove();
    this.userMarker = null;

    const bounds = new mapboxgl.LngLatBounds();
    let count = 0;

    if (
      this.userPosition &&
      Number.isFinite(this.userPosition.latitude) &&
      Number.isFinite(this.userPosition.longitude)
    ) {
      this.userMarker = new mapboxgl.Marker({ color: '#2563eb' })
        .setLngLat([this.userPosition.longitude, this.userPosition.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 20 }).setText('Votre position'))
        .addTo(this.map);
      bounds.extend([this.userPosition.longitude, this.userPosition.latitude]);
      count++;
    }

    for (const bien of this.biens ?? []) {
      const rawLat = bien?.latitude;
      const rawLng = bien?.longitude;
      if (
        rawLat === null ||
        rawLat === undefined ||
        rawLng === null ||
        rawLng === undefined ||
        String(rawLat).trim() === '' ||
        String(rawLng).trim() === ''
      ) {
        continue;
      }
      const lat = Number(rawLat);
      const lng = Number(rawLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'mbx-price-pin';
      pin.textContent = `${this.formatShortPrice(Number(bien.prix ?? 0))} FCFA`;

      const popupNode = this.buildBienPopup(bien);
      const popup = new mapboxgl.Popup({ offset: 18 }).setDOMContent(popupNode);

      const marker = new mapboxgl.Marker({ element: pin })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(this.map);

      this.explorerMarkers.push(marker);
      bounds.extend([lng, lat]);
      count++;
    }

    if (count > 1) {
      this.map.fitBounds(bounds, { padding: 56, maxZoom: 14 });
    } else if (count === 1) {
      const center = bounds.getCenter();
      this.map.flyTo({ center: [center.lng, center.lat], zoom: 13.5 });
    } else {
      this.map.flyTo({ center: MAPBOX_CONFIG.defaultCenter, zoom: MAPBOX_CONFIG.defaultZoom });
    }
  }

  private buildBienPopup(bien: any): HTMLElement {
    const card = document.createElement('div');
    card.className = 'mbx-popup-card';

    if (bien?.photos_urls?.length) {
      const img = document.createElement('img');
      img.className = 'mbx-popup-img';
      img.src = bien.photos_urls[0];
      img.alt = bien.titre ?? 'Bien immobilier';
      card.appendChild(img);
    }

    const title = document.createElement('h4');
    title.className = 'mbx-popup-title';
    title.textContent = bien.titre ?? 'Bien immobilier';
    card.appendChild(title);

    const loc = document.createElement('p');
    loc.className = 'mbx-popup-loc';
    const dist = bien.distance_km !== undefined ? ` (${bien.distance_km} km)` : '';
    loc.textContent = `${bien.quartier ?? ''}, ${bien.ville ?? ''}${dist}`;
    card.appendChild(loc);

    const price = document.createElement('p');
    price.className = 'mbx-popup-price';
    const formatted = Number(bien.prix ?? 0).toLocaleString('fr-FR');
    price.textContent = `${formatted} FCFA${bien.transaction === 'location' ? ' / mois' : ''}`;
    card.appendChild(price);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mbx-popup-btn';
    btn.textContent = 'Voir l’annonce';
    btn.addEventListener('click', () => this.selectBien.emit(Number(bien.id)));
    card.appendChild(btn);

    return card;
  }

  private formatShortPrice(price: number): string {
    if (price >= 1_000_000_000) {
      return `${(price / 1_000_000_000).toFixed(1).replace('.0', '')} Md`;
    }
    if (price >= 1_000_000) {
      return `${(price / 1_000_000).toFixed(1).replace('.0', '')} M`;
    }
    if (price >= 1_000) {
      return `${Math.round(price / 1_000)} k`;
    }
    return String(price);
  }

  private destroyMap(): void {
    this.explorerMarkers.forEach((m) => m.remove());
    this.explorerMarkers = [];
    this.singleMarker?.remove();
    this.singleMarker = null;
    this.userMarker?.remove();
    this.userMarker = null;
    this.map?.remove();
    this.map = null;
  }
}
