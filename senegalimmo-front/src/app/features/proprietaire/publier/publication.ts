import { Injectable, inject, signal } from '@angular/core';
import { Observable, concat, defer, map, of, switchMap, tap, toArray } from 'rxjs';
import { NouveauBien, NouvelleAnnonce } from '../../../core/modeles/proprietaire';
import { ProprietaireService } from '../../../core/services/proprietaire';

export type EtapePublication = 'bien' | 'photos' | 'annonce';

/**
 * Enchaîne POST /biens, POST /biens/{id}/medias pour chaque photo, puis POST /mes-annonces.
 * Retient ce qui a déjà réussi : après une erreur, un nouvel envoi reprend où il s'était arrêté.
 */
@Injectable()
export class Publication {
  private readonly service = inject(ProprietaireService);

  readonly etape = signal<EtapePublication | null>(null);
  readonly bienId = signal<string | null>(null);
  readonly photosEnvoyees = signal(0);

  publier(
    bien: NouveauBien,
    photos: readonly File[],
    annonce: Omit<NouvelleAnnonce, 'bien_id'>,
  ): Observable<void> {
    return this.enregistrerBien(bien).pipe(
      switchMap((id) => this.envoyerPhotos(id, photos).pipe(map(() => id))),
      switchMap((id) =>
        defer(() => {
          this.etape.set('annonce');
          return this.service.publierAnnonce({ ...annonce, bien_id: id });
        }),
      ),
      tap({ next: () => this.etape.set(null), error: () => this.etape.set(null) }),
      map(() => undefined),
    );
  }

  private enregistrerBien(bien: NouveauBien): Observable<string> {
    const deja = this.bienId();
    if (deja) return of(deja);
    return defer(() => {
      this.etape.set('bien');
      return this.service.creerBien(bien);
    }).pipe(
      map((b) => b.id),
      tap((id) => this.bienId.set(id)),
    );
  }

  private envoyerPhotos(bienId: string, photos: readonly File[]): Observable<unknown[]> {
    const restantes = photos.slice(this.photosEnvoyees());
    return concat(
      ...restantes.map((f) =>
        defer(() => {
          this.etape.set('photos');
          return this.service.ajouterPhoto(bienId, f);
        }).pipe(tap(() => this.photosEnvoyees.update((n) => n + 1))),
      ),
    ).pipe(toArray());
  }
}
