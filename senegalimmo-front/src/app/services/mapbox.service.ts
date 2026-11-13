import { Injectable } from '@angular/core';
import { MAPBOX_CONFIG } from '../config/mapbox.config';

export interface GeocodeResult {
  placeName: string;
  latitude: number;
  longitude: number;
  adresse: string;
  quartier: string;
  ville: string;
}

const STORAGE_KEY = 'senegalimmo_mapbox_token';

@Injectable({
  providedIn: 'root',
})
export class MapboxService {
  getAccessToken(): string {
    const configured = MAPBOX_CONFIG.accessToken?.trim();
    if (configured) {
      return configured;
    }
    try {
      return localStorage.getItem(STORAGE_KEY)?.trim() ?? '';
    } catch {
      return '';
    }
  }

  setRuntimeToken(token: string): void {
    const trimmed = token.trim();
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  hasToken(): boolean {
    return this.getAccessToken().length > 0;
  }

  async geocodeAddress(query: string): Promise<GeocodeResult[]> {
    const token = this.getAccessToken();
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    if (token) {
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json` +
          `?country=sn&language=fr&limit=5&access_token=${encodeURIComponent(token)}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const features = Array.isArray(data?.features) ? data.features : [];
          const parsed = features
            .filter((f: any) => Array.isArray(f?.center) && f.center.length >= 2)
            .map((f: any) => this.parseFeature(f));
          if (parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fallback transparent Nominatim
      }
    }

    // Secours gratuit Nominatim (OpenStreetMap Sénégal)
    try {
      const nomUrl =
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}` +
        `&countrycodes=sn&format=json&addressdetails=1&limit=5`;
      const res = await fetch(nomUrl, { headers: { 'Accept-Language': 'fr' } });
      if (res.ok) {
        const items = await res.json();
        return (items ?? []).map((item: any) => ({
          placeName: item.display_name,
          latitude: Number(parseFloat(item.lat).toFixed(6)),
          longitude: Number(parseFloat(item.lon).toFixed(6)),
          adresse: item.name || trimmed,
          quartier:
            item.address?.suburb ||
            item.address?.neighbourhood ||
            item.address?.quarter ||
            item.address?.residential ||
            '',
          ville: item.address?.city || item.address?.town || item.address?.county || 'Dakar',
        }));
      }
    } catch {
      // Ignorer
    }
    return [];
  }

  async reverseGeocode(longitude: number, latitude: number): Promise<GeocodeResult | null> {
    const token = this.getAccessToken();

    if (token) {
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json` +
          `?country=sn&language=fr&limit=1&access_token=${encodeURIComponent(token)}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const feature = data?.features?.[0];
          if (feature) {
            return this.parseFeature(feature);
          }
        }
      } catch {
        // Fallback transparent
      }
    }

    try {
      const revUrl =
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}` +
        `&format=json&addressdetails=1`;
      const res = await fetch(revUrl, { headers: { 'Accept-Language': 'fr' } });
      if (res.ok) {
        const item = await res.json();
        return {
          placeName: item.display_name,
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
          adresse: item.address?.road || item.name || '',
          quartier:
            item.address?.suburb ||
            item.address?.neighbourhood ||
            item.address?.quarter ||
            '',
          ville: item.address?.city || item.address?.town || 'Dakar',
        };
      }
    } catch {
      // Ignorer
    }
    return null;
  }

  getBrowserPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('La géolocalisation navigateur n’est pas disponible.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          });
        },
        () => {
          reject(new Error('Impossible de récupérer votre position GPS. Vérifiez les autorisations du navigateur.'));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  private parseFeature(feature: any): GeocodeResult {
    const [longitude, latitude] = feature.center as [number, number];
    const context = Array.isArray(feature.context) ? feature.context : [];

    const findContext = (prefixes: string[]) =>
      context.find((c: any) => prefixes.some((p) => String(c.id ?? '').startsWith(p)))?.text ?? '';

    const quartier =
      findContext(['neighborhood', 'locality']) ||
      (String(feature.id ?? '').startsWith('neighborhood') ? feature.text : '');
    const ville =
      findContext(['place', 'region']) ||
      (String(feature.id ?? '').startsWith('place') ? feature.text : '');

    return {
      placeName: feature.place_name || feature.text || '',
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      adresse: feature.text || '',
      quartier: quartier || '',
      ville: ville || 'Dakar',
    };
  }
}
