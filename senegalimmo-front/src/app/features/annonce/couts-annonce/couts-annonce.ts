import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { fcfa } from '../../../core/format/fcfa';
import { Annonce } from '../../../core/modeles/annonce';
import { TEXTES_ANNONCE } from '../textes';

/** Part de l'indemnité d'immobilisation, comme dans OffreAchat::accepter() côté serveur. */
const TAUX_INDEMNITE = 0.1;

interface Ligne {
  libelle: string;
  montant: string;
  total?: boolean;
}

interface Tableau {
  titre: string;
  lignes: Ligne[];
}

/** « Ce que vous payez » : chaque mois et à la signature pour une location, l'achat pour une vente. */
@Component({
  selector: 'si-couts-annonce',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (t of tableaux(); track t.titre) {
      <table class="w-full border-collapse text-[0.95rem]">
        <caption
          class="text-encre-3 pt-[18px] pb-1.5 text-left text-[0.82rem] font-semibold tracking-[0.06em] uppercase"
        >
          {{
            t.titre
          }}
        </caption>
        <tbody>
          @for (l of t.lignes; track l.libelle) {
            <tr [class]="l.total ? 'text-foreground font-bold [&>*]:border-input' : ''">
              <th
                scope="row"
                class="border-t border-border py-3 text-left"
                [class]="l.total ? 'font-bold' : 'text-encre-2 font-normal'"
              >
                {{ l.libelle }}
              </th>
              <td class="border-t border-border py-3 text-right tabular-nums">{{ l.montant }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
    <p class="text-encre-3 mt-4 text-[0.88rem]">{{ textes.moyens }}</p>
  `,
})
export class CoutsAnnonce {
  readonly annonce = input.required<Annonce>();
  protected readonly textes = TEXTES_ANNONCE;

  protected readonly tableaux = computed<Tableau[]>(() => {
    const { prix, charges, caution, type_transaction } = this.annonce();
    const t = this.textes;
    if (type_transaction === 'vente') {
      const indemnite = Math.round(prix * TAUX_INDEMNITE);
      return [
        {
          titre: t.siOffreAcceptee,
          lignes: [
            { libelle: t.prixDemande, montant: fcfa(prix) },
            { libelle: t.indemnite, montant: fcfa(indemnite) },
            { libelle: t.reste, montant: fcfa(prix - indemnite), total: true },
          ],
        },
      ];
    }
    return [
      {
        titre: t.chaqueMois,
        lignes: [
          { libelle: t.loyer, montant: fcfa(prix) },
          { libelle: t.charges, montant: fcfa(charges) },
          { libelle: t.totalMois, montant: fcfa(prix + charges), total: true },
        ],
      },
      {
        titre: t.aLaSignature,
        lignes: [
          { libelle: t.caution, montant: fcfa(caution) },
          { libelle: t.premierMois, montant: fcfa(prix + charges) },
          { libelle: t.totalSignature, montant: fcfa(caution + prix + charges), total: true },
        ],
      },
    ];
  });
}
