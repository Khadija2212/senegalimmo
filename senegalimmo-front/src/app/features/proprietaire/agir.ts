import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { messageErreur } from '../../core/services/demarches';

/**
 * Suivi des actions faites ligne par ligne : la ligne occupée et l'erreur de chaque ligne.
 * Créé dans le constructeur d'un composant de rubrique.
 */
export class SuiviActions {
  readonly enCours = signal<string | null>(null);
  readonly erreurs = signal<Readonly<Record<string, string>>>({});

  constructor(private readonly messageParDefaut: string) {}

  lancer(cle: string, requete: Observable<unknown>, reussi: () => void): void {
    this.enCours.set(cle);
    this.erreurs.update((tout) => sansCle(tout, cle));
    requete.subscribe({
      next: () => {
        this.enCours.set(null);
        reussi();
      },
      error: (e: unknown) => {
        this.enCours.set(null);
        this.erreurs.update((tout) => ({
          ...tout,
          [cle]: messageErreur(e, this.messageParDefaut),
        }));
      },
    });
  }
}

function sansCle(tout: Readonly<Record<string, string>>, cle: string): Record<string, string> {
  return Object.fromEntries(Object.entries(tout).filter(([k]) => k !== cle));
}
