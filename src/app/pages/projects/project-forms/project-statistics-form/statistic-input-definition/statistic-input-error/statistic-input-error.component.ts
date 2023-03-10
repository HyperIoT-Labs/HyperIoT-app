import { Component, ViewEncapsulation } from '@angular/core';
import { HytModal, HytModalService } from '@hyperiot/components';

@Component({
  selector: 'hyt-statistic-input-error',
  templateUrl: './statistic-input-error.component.html',
  styleUrls: ['./statistic-input-error.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StatisticInputErrorComponent extends HytModal {

  constructor(
    hytModalService: HytModalService
  ) {
    super(hytModalService);
  }

}
