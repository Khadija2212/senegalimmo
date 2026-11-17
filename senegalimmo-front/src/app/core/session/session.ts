import { Injectable, computed, signal } from '@angular/core';

export type Role = 'client' | 'proprietaire' | 'agent' | 'administrateur';

interface CompteConnecte {
  id: string;
  prenom: string;
  nom: string;
  role: Role;
}

const CLE_COMPTE = 'user';
const CLE_JETON = 'token';

/**
 * Compte connecté, lu là où l'écran de connexion le range.
 * Le jeton reste géré par l'intercepteur existant jusqu'à la refonte de la connexion.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly compte = signal<CompteConnecte | null>(lireCompte());

  readonly connecte = computed(() => this.compte() !== null);
  readonly role = computed(() => this.compte()?.role ?? null);
  readonly estClient = computed(() => this.role() === 'client');
}

function lireCompte(): CompteConnecte | null {
  try {
    if (!localStorage.getItem(CLE_JETON)) return null;
    const brut = localStorage.getItem(CLE_COMPTE);
    return brut ? (JSON.parse(brut) as CompteConnecte) : null;
  } catch {
    return null;
  }
}
