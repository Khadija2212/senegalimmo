import { Annonce } from '../modeles/annonce';

/** Ce que la page de connexion rappelle quand on y arrive depuis une annonce. */
export interface ContexteConnexion {
  titre: string;
  photo: string | null;
  action: string;
}

export const CHEMIN_CONNEXION = '/connexion';

/** Paramètres de navigation vers la connexion : retour à l'URL courante et rappel de l'annonce. */
export function versConnexion(
  urlCourante: string,
  annonce?: Annonce,
  action?: string,
): { queryParams: { retour: string }; state?: { contexte: ContexteConnexion } } {
  const queryParams = { retour: urlCourante };
  if (!annonce || !action) return { queryParams };
  const photo =
    [...annonce.bien.medias].filter((m) => m.type === 'photo').sort((a, b) => a.ordre - b.ordre)[0]
      ?.lien ?? null;
  return {
    queryParams,
    state: {
      contexte: {
        titre: annonce.bien.titre,
        photo,
        action,
      },
    },
  };
}

/** N'accepte qu'un chemin interne : jamais d'adresse externe ni de « //hôte ». */
export function retourSur(retour: string | null): string {
  return retour && retour.startsWith('/') && !retour.startsWith('//') ? retour : '/';
}
