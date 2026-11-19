/* Libellés d'état d'un compte : statut du compte, puis validation de l'agent ou identité du propriétaire. */
import { CompteAdmin } from '../../../core/modeles/admin';
import { TEXTES_COMPTES } from './textes';

const T = TEXTES_COMPTES;

export type Ton = 'ok' | 'attente' | 'non' | 'neutre';

export interface EtatLibelle {
  libelle: string;
  ton: Ton;
}

export const COULEURS: Readonly<Record<Ton, string>> = {
  ok: 'text-succes',
  attente: 'text-bleu-vif',
  non: 'text-refus',
  neutre: 'text-encre-3',
};

export function etatCompte(c: CompteAdmin): EtatLibelle {
  if (c.statut === 'suspendu') return { libelle: T.suspendu, ton: 'non' };
  if (c.statut === 'supprime') return { libelle: T.supprime, ton: 'neutre' };
  return { libelle: T.actif, ton: 'ok' };
}

/** Ce qui reste à contrôler sur le profil : validation de l'agent, identité du propriétaire. */
export function etatProfil(c: CompteAdmin): EtatLibelle | null {
  if (c.role === 'agent') {
    if (c.statut_validation === 'valide') return { libelle: T.agentValide, ton: 'ok' };
    if (c.statut_validation === 'refuse') return { libelle: T.validationRefusee, ton: 'non' };
    return { libelle: T.validationEnAttente, ton: 'attente' };
  }
  if (c.role === 'proprietaire') {
    return c.identite_verifiee
      ? { libelle: T.identiteVerifiee, ton: 'ok' }
      : { libelle: T.identiteNonVerifiee, ton: 'attente' };
  }
  return null;
}

export function agentEnAttente(c: CompteAdmin): boolean {
  return c.role === 'agent' && (c.statut_validation ?? 'en_attente') === 'en_attente';
}

export function identiteAVerifier(c: CompteAdmin): boolean {
  return c.role === 'proprietaire' && !c.identite_verifiee;
}
