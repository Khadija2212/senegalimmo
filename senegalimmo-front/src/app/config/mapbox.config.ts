export const MAPBOX_CONFIG = {
  /**
   * Collez ici votre clé publique Mapbox (commence par "pk.")
   * disponible sur https://account.mapbox.com/access-tokens/
   */
  accessToken: '',
  styles: {
    streets: 'mapbox://styles/mapbox/streets-v12',
    dark: 'mapbox://styles/mapbox/dark-v11',
  },
  defaultCenter: [-17.44406, 14.6937] as [number, number], // Dakar, Sénégal
  defaultZoom: 12,
};
