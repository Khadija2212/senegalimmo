import { Pipe, PipeTransform } from '@angular/core';
import { fcfa } from './fcfa';

@Pipe({ name: 'fcfa' })
export class FcfaPipe implements PipeTransform {
  transform(montant: number | null | undefined): string {
    return montant === null || montant === undefined ? '' : fcfa(montant);
  }
}
