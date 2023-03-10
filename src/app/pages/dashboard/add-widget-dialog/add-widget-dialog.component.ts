import { Component, OnInit, Output, EventEmitter, OnDestroy, Injector, ViewEncapsulation } from '@angular/core';
import { WidgetsService, Widget } from '@hyperiot/core';
import { KeyValue } from '@angular/common';
import { HytModal, HytModalService } from '@hyperiot/components';

interface WidgetClient {
  id?: number;
  entityVersion: number;
  categoryIds?: Array<number>;
  tagIds?: Array<number>;
  name?: string;
  description?: string;
  widgetCategory?: Widget.WidgetCategoryEnum;
  domains?: Array<Widget.DomainsEnum>;
  baseConfig?: any;
  type?: string;
  cols?: number;
  rows?: number;
  image?: string;
  preView?: string;
  avgRating?: number;
  count: number;
}

@Component({
  selector: 'hyt-add-widget-dialog',
  templateUrl: './add-widget-dialog.component.html',
  styleUrls: ['./add-widget-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddWidgetDialogComponent extends HytModal implements OnInit {

  ratingTotalStars = 5;
  filteredWidgets: WidgetClient[] = [];
  widgetCategoryList: any;
  widgetList: WidgetClient[] = [];
  selectedWidgets: WidgetClient[] = [];
  selectedCategory = null;
  widgetAddMax = 10;
  currentWidget: WidgetClient;

  dialogDataState = 0;

  os = '';
  mac = false;
  linux = false;

  constructor(
    hytModalService: HytModalService,
    private widgetsService: WidgetsService
  ) {
    super(hytModalService);
  }

  widgetsByCategory: any;

  // open modal
  ngOnInit() {
    this.dialogDataState = 0;
    //    super.open();

    this.os = navigator.platform;

    const lowOS = this.os.toLocaleLowerCase();

    if (lowOS.includes('mac')) {
      this.mac = true;
    } else if (lowOS.includes('linux')) {
      this.linux = true;
    }

    this.dialogDataState = 0;
    this.currentWidget = null;
    this.widgetCategoryList = [];
    this.widgetsByCategory = [];
    this.selectedWidgets = [];
    this.widgetList = [];

    this.widgetsService.findAllWidgetInCategories(this.data.signalIsOn ? 'realTime' : 'offline').subscribe(
      res => {
        this.widgetCategoryList = res.catInfo;
        this.widgetsByCategory = res.widgetMap;
        for (const key in this.widgetsByCategory) {
          if (this.widgetsByCategory[key]) {
            for (const el of this.widgetsByCategory[key]) {
              this.widgetList.push({
                id: el.id,
                entityVersion: el.entityVersion,
                count: 0,
                name: el.name,
                description: el.description,
                cols: el.cols,
                rows: el.rows,
                type: el.type,
                image: 'data:image/jpeg;base64,' + atob(el.image),
                preView: 'data:image/jpeg;base64,' + atob(el.preView),
                avgRating: el.avgRating,
                widgetCategory: el.widgetCategory
              });
            }
          }
        }
        this.onCategorySelect(this.widgetCategoryList.ALL);
        this.dialogDataState = 1;

      },
      error => {
        this.dialogDataState = -1;
      });

  }

  /****************************************************************************************** */

  // close($event?) {
  //   this.router.navigate(
  //     ['/dashboards'],
  //     {relativeTo: this.activatedRoute}
  //   );
  //   this.modalClose.emit($event);
  // }

  // dismiss(e: any) {
  //   if (e.target === this.viewContainer.nativeElement) {
  //     // this.close(e);
  //     this.close();
  //   }
  // }

  confirm() {
    const widgetOutput = [];
    this.selectedWidgets.forEach(w => {
      if (w.type === 'offline-table' || w.type === 'event-offline-table' || w.type === 'error-table') {
        w.baseConfig = { online: this.data.signalIsOn };
      }
      widgetOutput.push({
        count: w.count,
        x: 0,
        y: 0,
        type: w.type,
        cols: w.cols,
        rows: w.rows,
        name: w.name,
        dataUrl: '',
        dataTableUrl: '',
        config: w.baseConfig
      });
    });
    this.close(widgetOutput);
  }

  // addWidget(widget) {
  //   if (widget.count < this.widgetAddMax) {
  //     widget.count++;
  //   }
  //   this.onWidgetChange(widget);
  // }

  // removeWidget(widget) {
  //   if (widget.count > 0) {
  //     widget.count--;
  //   }
  //   this.onWidgetChange(widget);
  // }


  onWidgetChange(widget: WidgetClient) {
    if (widget.count === 0 && this.selectedWidgets.includes(widget)) {
      // remove
      const index = this.selectedWidgets.indexOf(widget);
      this.selectedWidgets.splice(index, 1);
    } else if (widget.count > 0 && !this.selectedWidgets.includes(widget)) {
      // add
      this.selectedWidgets.push(widget);
    }
  }

  onCategorySelect(category: any) {
    if (category.name === 'all') {
      this.filteredWidgets = [...this.widgetList];
    } else {
      this.filteredWidgets = this.widgetList.filter((w) => w.widgetCategory['name'] === category.name);
    }

    this.selectedCategory = category;
  }

  onRate(rating: any) {
    this.widgetsService.rateWidget(
      rating.newValue,
      { id: this.currentWidget.id, entityVersion: this.currentWidget.entityVersion }
    ).subscribe();
  }

  orderById(akv: KeyValue<string, any>, bkv: KeyValue<string, any>): number {
    const a = akv.value.index;
    const b = bkv.value.index;
    return a > b ? 1 : (b > a ? -1 : 0);
  }

}
