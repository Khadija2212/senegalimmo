import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { Annonce } from '../../core/modeles/annonce';
import { ComparaisonService } from '../../core/services/comparaison';
import { SelectionService } from '../../core/services/selection';
import {
  COMPARAISON_MIN,
  idsAComparer,
  lignesComparaison,
  photoPrincipale,
} from './comparateur-vue';
import { LIENS_COMPARATEUR, TEXTES_COMPARATEUR } from './textes';

/** Cas « Comparer des biens » : deux à quatre annonces côte à côte. */
@Component({
  selector: 'si-comparateur',
  imports: [RouterLink, NgIcon, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comparateur.html',
  styleUrls: ['../../shared/espace/rubriques.css', '../../shared/espace/lien-texte.css'],
  host: { class: 'block' },
})
export class Comparateur {
  /** Paramètre « ids » de l'adresse : identifiants séparés par des virgules. */
  readonly ids = input<string | undefined>(undefined);

  protected readonly textes = TEXTES_COMPARATEUR;
  protected readonly liens = LIENS_COMPARATEUR;
  protected readonly photo = photoPrincipale;
  private readonly service = inject(ComparaisonService);
  private readonly selection = inject(SelectionService);
  private readonly router = inject(Router);

  protected readonly demandes = computed(() =>
    idsAComparer(this.ids(), this.selection.comparees()),
  );

  /** Retirer une annonce déjà chargée ne relance pas la requête : on filtre ce qu'on a. */
  private readonly aCharger = linkedSignal<readonly string[], readonly string[]>({
    source: this.demandes,
    computation: (ids, precedent) =>
      precedent && ids.every((id) => precedent.value.includes(id)) ? precedent.value : ids,
  });

  protected readonly donnees = rxResource({
    params: () => (this.demandes().length >= COMPARAISON_MIN ? this.aCharger() : undefined),
    stream: ({ params }) => this.service.comparer(params),
  });

  protected readonly annonces = computed<Annonce[]>(() => {
    const liste = this.donnees.hasValue() ? this.donnees.value() : [];
    return this.demandes()
      .map((id) => liste.find((a) => a.id === id))
      .filter((a): a is Annonce => !!a);
  });
  protected readonly lignes = computed(() => lignesComparaison(this.annonces()));
  protected readonly vide = computed(
    () =>
      this.demandes().length < COMPARAISON_MIN ||
      (this.donnees.hasValue() && this.annonces().length < COMPARAISON_MIN),
  );

  protected retirer(id: string): void {
    if (this.selection.estComparee(id)) this.selection.basculerComparaison(id);
    const restants = this.demandes().filter((x) => x !== id);
    this.router.navigate([], {
      queryParams: { ids: restants.join(',') },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
