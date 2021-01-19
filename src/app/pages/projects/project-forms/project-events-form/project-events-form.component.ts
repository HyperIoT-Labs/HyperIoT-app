import { Component, OnChanges, OnDestroy, ViewChild, Input, Injector, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subscription, Observable } from 'rxjs';

import { HpacketsService, HPacket, HProject, RulesService, Rule } from '@hyperiot/core';
import { ProjectFormEntity, LoadingStatusEnum } from '../project-form-entity';
import { RuleDefinitionComponent } from '../rule-definition/rule-definition.component';
import { EventMailComponent } from './event-mail/event-mail.component';
import { Option } from '@hyperiot/components';
import { SummaryListItem } from '../../project-detail/generic-summary-list/generic-summary-list.component';

@Component({
  selector: 'hyt-project-events-form',
  templateUrl: './project-events-form.component.html',
  styleUrls: ['./project-events-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProjectEventsFormComponent extends ProjectFormEntity implements OnChanges, OnDestroy {

  entity: Rule = {} as Rule;
  entityFormMap = {
    'rule-name': {
      field: 'name'
    },
    'rule-description': {
      field: 'description'
    }
  };

  private activatedRouteSubscription: Subscription;

  @Input()
  currentProject: HProject;

  @ViewChild('eventDef')
  ruleDefinitionComponent: RuleDefinitionComponent;

  @ViewChild('eventMail')
  eventMailComponent: EventMailComponent;

  outputOptions: Option[] = [
    { value: 'events.SendMailAction', label: $localize`:@@HYT_send_email:SEND E-MAIL`, checked: true }
    // { value: '', label: $localize`:@@HYT_start_statistic:START STATISTIC` }
  ];

  constructor(
    injector: Injector,
    private hPacketService: HpacketsService,
    private rulesService: RulesService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    super(injector);
    this.formTemplateId = 'container-events';
    this.longDefinition = this.entitiesService.event.longDefinition;
    this.formTitle = this.entitiesService.event.formTitle;
    this.icon = this.entitiesService.event.icon;
    this.hideDelete = true; // hide 'Delete' button
    this.activatedRouteSubscription = this.activatedRoute.parent.params.subscribe(routeParams => {
      if (routeParams.projectId) {
        this.currentProject = {id: routeParams.projectId, entityVersion: null}; // read id of project
        this.loadData();
      }
    });
  }

  ngOnChanges() {
    if (this.currentProject) {
      this.updateSummaryList();
    }
  }

  ngOnDestroy() {
    this.activatedRouteSubscription.unsubscribe();
  }

  save(successCallback, errorCallback) {
    this.saveEvent(successCallback, errorCallback);
  }

  loadEmpty() {
    this.form.reset();
    this.ruleDefinitionComponent.resetRuleDefinition();
    this.eventMailComponent.reset();
    this.entity = { ...this.entitiesService.event.emptyModel };
    this.edit();
  }

  edit(rule?: Rule, readyCallback?) {
    const proceedWithEdit = () => {
      this.showCancel = true;
      this.editMode = true;
      super.edit(rule, () => {
        this.ruleDefinitionComponent.setRuleDefinition(this.entity.ruleDefinition);
        this.eventMailComponent.setMail(JSON.parse(this.entity.jsonActions));
        this.form.get('eventOutput').setValue(JSON.parse(JSON.parse(this.entity.jsonActions)[0]).actionName);
        if (readyCallback) {
          readyCallback();
        }
      });
    };
    const canDeactivate = this.canDeactivate();
    if (typeof canDeactivate === 'boolean' && canDeactivate === true) {
      proceedWithEdit();
    } else {
      (canDeactivate as Observable<any>).subscribe((res) => {
        if (res) {
          proceedWithEdit();
        }
      });
    }
  }

  loadData() {
    this.updateSummaryList();
    this.entityEvent.emit({
      event: 'treeview:focus',
      id: this.currentProject.id, type: 'project-events'
    });
  }

  loadHPackets() {
    this.ruleDefinitionComponent.loadHPackets();
  }

  updateSummaryList() {
    this.rulesService.findAllRuleByProjectId(this.currentProject.id).subscribe((rules: Rule[]) => {
      this.summaryList = {
        title: this.formTitle,
        list: rules
          .filter(r => r.type === Rule.TypeEnum.EVENT)
          .map(l => {
            return { name: l.name, description: l.description, data: l };
          }) as SummaryListItem[]
      };
    });
  }

  private saveEvent(successCallback?, errorCallback?) {
    this.loadingStatus = LoadingStatusEnum.Saving;
    this.resetErrors();

    let jActionStr = '';

    if (this.form.value.eventOutput === 'events.SendMailAction') {
      const mail = this.eventMailComponent.buildMail();
      const act = {
        actionName: this.form.get('eventOutput').value,
        recipients: mail.mailRecipient,
        ccRecipients: mail.mailCC,
        subject: mail.mailObject,
        body: mail.mailBody
      };
      const jActions = [JSON.stringify(act)];
      jActionStr = JSON.stringify(jActions);
    }

    const e = this.entity;
    e.name = this.form.get('rule-name').value;
    e.description = this.form.get('rule-description').value;
    e.ruleDefinition = this.ruleDefinitionComponent.buildRuleDefinition();
    e.jsonActions = jActionStr;
    delete e.actions;
    delete e.parent;
    const wasNew = this.isNew();
    const responseHandler = (res) => {
      this.entity = res;
      this.resetForm();
      this.updateSummaryList();
      this.showCancel = false;
      this.loadingStatus = LoadingStatusEnum.Ready;
      successCallback && successCallback(res, wasNew);
    };

    if (e.id) {
      this.rulesService.updateRule(e).subscribe(responseHandler, (err) => {
        this.setErrors(err);
        errorCallback && errorCallback(err);
        this.loadingStatus = LoadingStatusEnum.Error;
      });
    } else {
      e.entityVersion = 1;
      e.project = { id: this.currentProject.id, entityVersion: this.currentProject.entityVersion };
      e.packet = null;  // event rules are not bound to packets anymore
      e.type = 'EVENT';
      this.rulesService.saveRule(e).subscribe(responseHandler, (err) => {
        this.setErrors(err);
        errorCallback && errorCallback(err);
        this.loadingStatus = LoadingStatusEnum.Error;
      });
    }

  }
  cancel() {
    this.resetErrors();
    this.resetForm();
    this.editMode = false;
    this.showCancel = false;
  }
  delete(successCallback, errorCallback) {
    this.rulesService.deleteRule(this.entity.id).subscribe((res) => {
      this.resetErrors();
      this.resetForm();
      this.showCancel = false;
      this.updateSummaryList();
      if (successCallback) { successCallback(); }
    }, (err) => {
      if (errorCallback) { errorCallback(); }
    });
  }

  isDirty() {
    return this.editMode && (super.isDirty() || this.ruleDefinitionComponent.isDirty() || this.eventMailComponent.isDirty());
  }

  isValid(): boolean {
    return (this.editMode && this.ruleDefinitionComponent && this.eventMailComponent) ?
      (super.isValid() &&
        !this.ruleDefinitionComponent.isInvalid() &&
        !this.eventMailComponent.isInvalid()
      ) : false;
  }

  setErrors(err) {

    if (err.error && err.error.type) {
      switch (err.error.type) {
        case 'it.acsoftware.hyperiot.base.exception.HyperIoTDuplicateEntityException': {
          this.validationError = [{ "message": $localize`:@@HYT_unavailable_event_name:Unavailable event name`, "field": 'rule-name', "invalidValue": '' }];
          this.form.get('rule-name').setErrors({
            validateInjectedError: {
              valid: false
            }
          });
          this.loadingStatus = LoadingStatusEnum.Ready;
          break;
        }
        case 'it.acsoftware.hyperiot.base.exception.HyperIoTValidationException': {
          super.setErrors(err);
          break;
        }
        default: {
          this.loadingStatus = LoadingStatusEnum.Error;
        }
      }
    } else {
      this.loadingStatus = LoadingStatusEnum.Error;
    }

  }

}