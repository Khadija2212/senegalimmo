import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { messageErreur } from '../../../core/services/demarches';

/** Action en cours et erreurs, ligne par ligne, d'un registre de l'administration. */
export class SuiviActions {
  readonly enCours = signal<string | null>(null);
  readonly erreurs = signal<Readonly<Record<string, string>>>({});

  constructor(private readonly parDefaut: string) {}

  erreur(cle: string): string | null {
    return this.erreurs()[cle] ?? null;
  }

  lancer<T>(
    cle: string,
    requete: Observable<T>,
    reussite: (r: T) => void,
    echec?: () => void,
  ): void {
    this.enCours.set(cle);
    this.erreurs.update((tout) => sansCle(tout, cle));
    requete.subscribe({
      next: (r) => {
        this.enCours.set(null);
        reussite(r);
      },
      error: (e: unknown) => {
        this.enCours.set(null);
        this.erreurs.update((tout) => ({ ...tout, [cle]: messageErreur(e, this.parDefaut) }));
        echec?.();
      },
    });
  }
}

function sansCle(tout: Readonly<Record<string, string>>, cle: string): Record<string, string> {
  return Object.fromEntries(Object.entries(tout).filter(([k]) => k !== cle));
}
