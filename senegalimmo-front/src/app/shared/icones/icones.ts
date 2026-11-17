/*
  Jeu d'icônes SénégalImmo. Grille 24, trait 1,6, bouts et jonctions arrondis.
  Signature : coins coupés à 45 degrés, repris des claustras des façades dakaroises.
  Chaque icône est fournie à @ng-icons/core sous le nom « si » + son nom.
*/
const TRACES = {
  siChercher: 'M8 4h5l3 3v5l-3 3H8L5 12V7z M16 15l4.5 4.5',
  siBorne: 'M12 3l4 4v6H8V7z M10.5 9h3 M12 13v6 M7 21h10',
  siAutour: 'M10 7h4l3 3v4l-3 3h-4l-3-3v-4z M12 2v3 M12 19v3 M2 12h3 M19 12h3',
  siImmeuble: 'M5 21V4h9v17 M14 9h5v12 M3 21h18 M8 8h3 M8 12h3 M8 16h3 M16 13h1 M16 17h1',
  siVilla: 'M3 21h18 M4 21V11h16v10 M4 11V8h9v3 M9 21v-5h4v5 M15 14h2v2h-2z',
  siSurface: 'M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5 M9 9h6v6H9z',
  siChambre: 'M3 19V8 M3 14h18v5 M6 14v-3h5v3',
  siPieces: 'M4 4h13l3 3v13H4z M4 12h6 M10 4v4 M10 16v4 M14 12h6',
  siGarder: 'M6 3h12v15l-6 3-6-3z M9 8h6 M9 11h4',
  siComparer: 'M4 20V9h6v11 M14 20V4h6v16 M2 20h20 M6 13h2 M16 9h2',
  siCarte: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14',
  siListe: 'M4 5h4v4H4z M4 15h4v4H4z M11 6h9 M11 8h5 M11 16h9 M11 18h5',
  siCle: 'M3 9h7v6H3z M10 12h11 M17 12v3 M20 12v2.5 M5.5 11.5h2v1h-2z',
  siContrat: 'M6 3h8l4 4v14H6z M14 3v4h4 M9 10h6 M9 13h4 M13 17l1.5-1.5 1.5 1.5-1.5 1.5z',
  siSceau: 'M8.6 3.5h6.8l4.8 4.8v6.8l-4.8 4.8H8.6l-4.8-4.8V8.3z M8.6 12.3l2.3 2.3 4.6-4.8',
  siMobile: 'M8 3h8v18H8z M11 18h2 M4 9h9v5H4z M7 11.5h3',
  siMessage: 'M3 5h12v8H8l-3 3v-3H3z M18 9h3v8h-2v3l-3-3h-5v-1',
  siCompte: 'M10 3h4l2 2v4l-2 2h-4L8 9V5z M4 21v-3l3-3h10l3 3v3',
  siReglages: 'M6 4v16 M12 4v16 M18 4v16 M4 8h4 M10 15h4 M16 10h4',
  siCalendrier: 'M4 6h13l3 3v11H4z M4 10h16 M8 3v5 M15 3v5 M8 14h2v2H8z',
  siSignaler: 'M6 21V4 M6 4h10l-2 4 2 4H6',
  siMenu: 'M4 7h16 M4 12h16 M4 17h10',
  siFermer: 'M6 6l12 12 M18 6L6 18',
  siBas: 'M6 9l6 6 6-6',
  siHaut: 'M6 15l6-6 6 6',
  siGauche: 'M15 6l-6 6 6 6',
  siDroite: 'M9 6l6 6-6 6',
  siCoche: 'M5 12.5l4.5 4.5L19 7.5',
} as const;

export type NomIcone = keyof typeof TRACES;

function versSvg(trace: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    `stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${trace}"/></svg>`
  );
}

export const ICONES: Record<NomIcone, string> = Object.fromEntries(
  Object.entries(TRACES).map(([nom, trace]) => [nom, versSvg(trace)]),
) as Record<NomIcone, string>;
