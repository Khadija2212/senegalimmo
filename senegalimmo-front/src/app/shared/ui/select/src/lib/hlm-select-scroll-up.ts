import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ICONES } from '../../../../icones/icones';
import { BrnSelectScrollUp } from '@spartan-ng/brain/select';
import { classes } from '@spartan-ng/helm/utils';

@Component({
  selector: 'hlm-select-scroll-up',
  exportAs: 'hlmSelectScrollUp',
  imports: [NgIcon],
  providers: [provideIcons({ siHaut: ICONES.siHaut })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnSelectScrollUp],
  template: ` <ng-icon name="siHaut" /> `,
})
export class HlmSelectScrollUp {
  constructor() {
    classes(
      () =>
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] sticky top-0 w-full data-hidden:hidden",
    );
  }
}
