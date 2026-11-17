/*
  Style Standard de Mapbox, recoloré avec la palette Océan.
  Les points d'intérêt, les transports et la 3D sont masqués pour que les prix ressortent.
*/
export const STYLE_CARTE = {
  style: 'mapbox://styles/mapbox/standard',
  config: {
    basemap: {
      lightPreset: 'day',
      colorLand: '#def8ff',
      colorWater: '#86d9fd',
      colorGreenspace: '#bdf2ff',
      colorCommercial: '#eefbff',
      colorIndustrial: '#eefbff',
      colorEducation: '#eefbff',
      colorMedical: '#eefbff',
      colorBuildings: '#e6f8ff',
      colorRoads: '#ffffff',
      colorMotorways: '#bdf2ff',
      colorTrunks: '#ffffff',
      colorPlaceLabels: '#00185e',
      colorRoadLabels: '#384b81',
      showPointOfInterestLabels: false,
      showTransitLabels: false,
      show3dObjects: false,
    },
  },
} as const;

export const CENTRE_DAKAR: [number, number] = [-17.474, 14.713];

export const TEXTES_CARTE = {
  sansCle: 'Carte indisponible : la clé Mapbox n’est pas configurée.',
} as const;
