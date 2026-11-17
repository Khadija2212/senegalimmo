import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { FcfaPipe } from '../../../core/format/fcfa.pipe';
import { Annonce } from '../../../core/modeles/annonce';
import { SelectionService } from '../../../core/services/selection';
import { SessionService } from '../../../core/session/session';
import { TEXTES_ACCUEIL } from '../textes';

const CHEMIN_CONNEXION = '/login';

/** Fiche d'une annonce dans les résultats. */
@Component({
  selector: 'si-fiche-annonce',
  imports: [RouterLink, NgIcon, FcfaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fiche-annonce.html',
  host: { class: 'block border-b border-border py-[22px] first:pt-0' },
})
export class FicheAnnonce {
  readonly annonce = input.required<Annonce>();
  protected readonly textes = TEXTES_ACCUEIL;
  protected readonly selection = inject(SelectionService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly bien = computed(() => this.annonce().bien);
  protected readonly photo = computed(
    () => [...this.bien().medias].sort((a, b) => a.ordre - b.ordre)[0]?.lien ?? null,
  );
  protected readonly lien = computed(() => ['/annonces', this.annonce().id]);

  protected garder(): void {
    if (!this.session.estClient()) {
      this.router.navigate([CHEMIN_CONNEXION], { queryParams: { retour: this.router.url } });
      return;
    }
    this.selection.basculerFavori(this.annonce().id).subscribe();
  }

  protected pluriel(n: number, un: string, plusieurs: string): string {
    return `${n} ${n > 1 ? plusieurs : un}`;
  }
}
