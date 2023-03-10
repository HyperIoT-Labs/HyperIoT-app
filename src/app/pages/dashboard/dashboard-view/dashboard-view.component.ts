import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { WidgetsLayoutComponent } from '../widgets-layout/widgets-layout.component';
import { Subject } from 'rxjs';
import { Dashboard } from '@hyperiot/core';

@Component({
  selector: 'hyt-dashboard-view',
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.css']
})
export class DashboardViewComponent implements OnInit {
  @ViewChild(WidgetsLayoutComponent)
  dashboardLayout: WidgetsLayoutComponent;

  @Input() dashboard: Dashboard;
  @Input() dashboardType: any;
  @Input() dashboardWidgets;

  @Output() dashboardViewEvent: EventEmitter<any> = new EventEmitter<any>();

  @Output() dsTopologyResTimeChange: EventEmitter<any> = new EventEmitter<any>();

  bool = false;

  /** Subject for manage the open subscriptions */
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private router: Router
  ) { }

  ngOnInit() { }

  onAddingWidgets(event) {
    this.onWidgetsAdd(event);
    // console.log("adding widgets",event)
    // event.addWidgets
    // .pipe(takeUntil(this.ngUnsubscribe))
    // .subscribe(
    //   (widgets) => {this.onWidgetsAdd(widgets)}
    // );
  }

  saveDashboard() {
    this.dashboardLayout.saveDashboard();
  }

  onWidgetsAdd(widgetList: any[]) {
    widgetList.map((widget) => {
      this.dashboardLayout.addItem(widget);
    });
  }

}
