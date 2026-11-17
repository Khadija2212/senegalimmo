/* Types des réponses de l'API, alignés sur les classes Annonce, Bien, Media du diagramme. */

export type TypeTransaction = 'location' | 'vente';

export type TypeBien =
  | 'appartement'
  | 'maison'
  | 'villa'
  | 'studio'
  | 'chambre'
  | 'terrain'
  | 'bureau'
  | 'local_commercial';

export interface Media {
  id: string;
  type: 'photo' | 'video' | 'plan' | 'document';
  ordre: number;
  lien: string;
}

export interface Personne {
  id: string;
  prenom: string;
  nom: string;
}

export interface Proprietaire extends Personne {
  identite_verifiee: boolean;
}

export interface Agent extends Personne {
  agence: string | null;
}

export interface Bien {
  id: string;
  titre: string;
  description: string;
  type: TypeBien;
  surface: number;
  nombre_pieces: number;
  nombre_chambres: number;
  meuble: boolean;
  adresse: string;
  quartier: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  medias: Media[];
  proprietaire?: Proprietaire;
}

export interface Annonce {
  id: string;
  reference: string;
  type_transaction: TypeTransaction;
  prix: number;
  charges: number;
  caution: number;
  badge_verifie: boolean;
  est_premium: boolean;
  nombre_vues: number;
  publiee_le: string | null;
  bien: Bien;
}

export interface AnnonceDetaillee extends Annonce {
  agent: Agent | null;
}

export interface PointCarte {
  id: string;
  reference: string;
  prix: number;
  charges: number;
  type_transaction: TypeTransaction;
  titre: string;
  latitude: number;
  longitude: number;
}

export interface ResumeRecherche {
  verifiees: number;
  prix_min: number | null;
}

export interface PageAnnonces {
  data: Annonce[];
  current_page: number;
  last_page: number;
  total: number;
  resume: ResumeRecherche;
}

export type Tri = 'recent' | 'prix_asc' | 'prix_desc';

export interface CriteresRecherche {
  type_transaction: TypeTransaction;
  type?: TypeBien;
  ville?: string;
  quartier?: string;
  prix_max?: number;
  chambres_min?: number;
  surface_min?: number;
  meuble?: boolean;
  lat?: number;
  lng?: number;
  tri?: Tri;
}
