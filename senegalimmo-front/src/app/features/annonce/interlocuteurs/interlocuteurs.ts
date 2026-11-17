import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnnonceDetaillee } from '../../../core/modeles/annonce';
import { TEXTES_ANNONCE } from '../textes';

interface Interlocuteur {
  id: string;
  initiales: string;
  nom: string;
  role: string;
}

const CHEMIN_MESSAGES = '/messages';

/** « Qui vous répond » : le propriétaire et, s'il y en a un, l'agent mandaté (Bien::interlocuteurs). */
@Component({
  selector: 'si-interlocuteurs',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="border-t border-border">
      @for (p of personnes(); track p.id) {
        <li
          class="grid grid-cols-[44px_1fr] items-center gap-4 border-b border-border py-4 sm:grid-cols-[48px_1fr_auto]"
        >
          <span
            aria-hidden="true"
            class="initiales bg-glace text-bleu-vif grid size-11 place-items-center border border-input font-bold sm:size-12"
            >{{ p.initiales }}</span
          >
          <div>
            <b class="block font-semibold">{{ p.nom }}</b
            ><span class="text-encre-2 text-[0.88rem]">{{ p.role }}</span>
          </div>
          <a
            class="col-start-2 text-[0.9rem] font-semibold underline decoration-input underline-offset-4 hover:text-bleu-vif sm:col-start-auto"
            [routerLink]="lienMessages"
            [queryParams]="{ a: p.id, annonce: annonce().id }"
            >{{ textes.ecrire }}</a
          >
        </li>
      }
    </ul>
  `,
  styles: `
    .initiales {
      clip-path: polygon(0 0, 78% 0, 100% 22%, 100% 100%, 22% 100%, 0 78%);
    }
  `,
})
export class Interlocuteurs {
  readonly annonce = input.required<AnnonceDetaillee>();
  protected readonly textes = TEXTES_ANNONCE;
  protected readonly lienMessages = CHEMIN_MESSAGES;

  protected readonly personnes = computed<Interlocuteur[]>(() => {
    const { bien, agent } = this.annonce();
    const liste: Interlocuteur[] = [];
    const p = bien.proprietaire;
    if (p) {
      const role = p.identite_verifiee
        ? `${this.textes.proprietaire}, ${this.textes.identiteVerifiee}`
        : this.textes.proprietaire;
      liste.push({
        id: p.id,
        initiales: initiales(p.prenom, p.nom),
        nom: `${p.prenom} ${p.nom}`,
        role,
      });
    }
    if (agent) {
      liste.push({
        id: agent.id,
        initiales: initiales(agent.prenom, agent.nom),
        nom: `${agent.prenom} ${agent.nom}`,
        role: this.textes.agentMandate,
      });
    }
    return liste;
  });
}

function initiales(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}
