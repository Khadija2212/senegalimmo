import { MAPBOX_JETON } from './jetons';

/*
  Réglages du front. La clé Mapbox publique (préfixe pk.) vient du fichier .env,
  recopiée dans jetons.ts par scripts/ecrire-jetons.mjs avant chaque lancement.
*/
export const ENVIRONNEMENT = {
  apiUrl: 'http://127.0.0.1:8000/api',
  mapboxJeton: MAPBOX_JETON,
} as const;
