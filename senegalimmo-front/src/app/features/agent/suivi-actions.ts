import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { messageErreur } from '../../core/services/demarches';

/** Action en cours et erreur de chaque ligne d'un registre, repérée par sa clé. */
export class SuiviActions {
  readonly enCours = signal<string | null>(null);
  readonly erreurs = signal<Readonly<Record<string, string>>>({});

  constructor(private readonly parDefaut: string) {}

  agir(cle: string, requete: Observable<unknown>, apres: () => void): void {
    this.enCours.set(cle);
    this.erreurs.update((tout) => sansCle(tout, cle));
    requete.subscribe({
      next: () => {
        this.enCours.set(null);
        apres();
      },
      error: (e: unknown) => {
        this.enCours.set(null);
        this.erreurs.update((tout) => ({ ...tout, [cle]: messageErreur(e, this.parDefaut) }));
      },
    });
  }
}

function sansCle(tout: Readonly<Record<string, string>>, cle: string): Record<string, string> {
  return Object.fromEntries(Object.entries(tout).filter(([k]) => k !== cle));
}
