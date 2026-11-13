import { Pipe, PipeTransform, inject } from '@angular/core';
import { DeviseService } from '../services/devise';

// Impur : le texte doit se mettre à jour quand la devise ou les taux changent
@Pipe({
  name: 'devise',
  standalone: true,
  pure: false,
})
export class DevisePipe implements PipeTransform {
  private service = inject(DeviseService);

  transform(montantXof: number | string | null | undefined): string {
    return this.service.formater(montantXof);
  }
}