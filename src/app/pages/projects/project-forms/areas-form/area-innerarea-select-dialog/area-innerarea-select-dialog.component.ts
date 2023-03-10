import { Component, OnInit } from '@angular/core';
import { Area, AreasService } from '@hyperiot/core';
import { HytModalService, HytModal } from '@hyperiot/components';

@Component({
  selector: 'hyt-area-innerarea-select-dialog',
  templateUrl: './area-innerarea-select-dialog.component.html',
  styleUrls: ['./area-innerarea-select-dialog.component.scss']
})
export class AreaInnerareaSelectDialogComponent extends HytModal implements OnInit {

  selectedArea: Area;

  constructor(
    hytModalService: HytModalService,
    private areaService: AreasService
  ) {
    super(hytModalService);
  }

  ngOnInit() {
  }

}
