import { Component, OnInit, Input, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

import { HPacket, HPacketField, HpacketsService } from '@hyperiot/core';
import { UnitConversionService } from 'src/app/services/unit-conversion.service';

export class FieldMatrixConfiguration {
  field: {id: number, name: string};
  map: FieldMatrixMapItem[];
}
export class FieldMatrixMapItem {
  coords: string;
  name: string;
  index: number;
}
export class FieldUnitConversion {
  field: {id: number, name: string};
  convertFrom: string;
  convertTo: string;
  decimals: number;
  options: any[];
}

@Component({
  selector: 'hyt-packet-table-select',
  templateUrl: './packet-table-select.component.html',
  styleUrls: ['./packet-table-select.component.scss'],
  encapsulation: ViewEncapsulation.None,
  viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class PacketTableSelectComponent implements OnInit {

  @Input() widget;
  @Input()
  selectedPacket: HPacket = null;
  @Input()
  selectedFields: any = [];
  @Output()
  selectedFieldsChange = new EventEmitter();
  projectPackets: HPacket[] = [];

  packetFieldsMapping: FieldMatrixConfiguration[];
  packetUnitsConversion: FieldUnitConversion[];
  conversionDecimalsOptions = [
    {label: '0', value: 0},
    {label: '1', value: 1},
    {label: '2', value: 2},
    {label: '3', value: 3},
    {label: '4', value: 4},
    {label: '5', value: 5},
  ];

  constructor(
    private packetService: HpacketsService,
    public settingsForm: NgForm,
    private unitConversionService: UnitConversionService
  ) {}

  ngOnInit() {
    this.loadPackets();
  }

  onPacketChange() {
    this.selectedFields = [];
    this.selectedFieldsChange.emit(this.selectedFields);
  }

  onPacketFieldChange($event) {
    const nullIndex = this.selectedFields.indexOf(null);
    if (nullIndex >= 0) {
      delete this.selectedFields[nullIndex];
    }
    // units conversion
    this.syncUnitsConversion();
    // fields mapping for current packet field
    this.syncFieldMapping();
    this.selectedFieldsChange.emit(this.selectedFields);
  }

  onPacketUnitConversionChange(unit, i) {
    this.packetUnitsConversion[i].convertTo = unit;
  }

  onAddFieldMapping(fieldMatrix: FieldMatrixConfiguration) {
    fieldMatrix.map.push(new FieldMatrixMapItem());
  }
  onDeleteFieldMapping(fieldMatrix: FieldMatrixConfiguration, mapIndex: number) {
    fieldMatrix.map.splice(mapIndex, 1);
  }
  onFieldMappingChange(fieldMap: FieldMatrixMapItem, value: string) {
    fieldMap.name = value;
  }

  apply() {
    if (this.selectedPacket) {
      this.widget.config.packetId = this.selectedPacket.id;
      this.widget.config.packetFields = {};
      this.selectedFields.map((pf) => this.widget.config.packetFields[pf.id] = pf.name);
      this.widget.config.packetFieldsMapping = this.packetFieldsMapping;
      this.widget.config.packetUnitsConversion = this.packetUnitsConversion;
    }
  }

  packetCompare(p1: HPacket, p2: HPacket) {
    return p1 != null && p2 != null && p1.id === p2.id;
  }

  loadPackets() {
    this.packetFieldsMapping = this.widget.config.packetFieldsMapping ?
        JSON.parse(JSON.stringify(this.widget.config.packetFieldsMapping)) : [];
    this.packetUnitsConversion = this.widget.config.packetUnitsConversion ?
        JSON.parse(JSON.stringify(this.widget.config.packetUnitsConversion)) : [];
    // fetch all packets
    this.packetService
      .findAllHPacketByProjectId(this.widget.projectId)
      .subscribe((packetList) => {
        this.projectPackets = packetList;
        const w = this.widget;
        // load curent packet data and set selected fields
        if (w.config && w.config.packetId) {
          this.packetService.findHPacket(w.config.packetId)
            .subscribe((packet: HPacket) => {
              this.selectedPacket = packet;
              if (this.widget.config.packetFields) {
                packet.fields.map((pf) => {
                  if (this.widget.config.packetFields[pf.id]) {
                    this.selectedFields.push(pf);
                  }
                });
                this.syncUnitsConversion();
                this.syncFieldMapping();
              }
            });
        }
      });
  }

  hasFieldsUnit() {
    if (this.selectedFields.length === 0) {
      return 0;
    }
    const unitCount = this.selectedFields.reduce((a, b) => (a + b.unit ? 1 : 0));
    return unitCount > 0;
  }

  private syncUnitsConversion() {
    if (!this.packetUnitsConversion) {
      this.packetUnitsConversion = [];
    }
    const tempMap = [] as FieldUnitConversion[];
    const addFieldConversion = (f: HPacketField) => {
      if (!f.unit) {
        return;
      }
      let unitConvert = this.packetUnitsConversion.find((uc) => uc.field.id === f.id);
      if (!unitConvert) {
        unitConvert = {
          field: {id: f.id, name: f.name},
          convertFrom: f.unit,
          convertTo: f.unit,
          decimals: 1,
          options: this.getUnitOptions(f.unit)
        };
        tempMap.push(unitConvert);
      } else {
        unitConvert.convertFrom = f.unit;
        tempMap.push(unitConvert);
      }
      unitConvert.field.name = f.name;
    };
    this.selectedFields.map((pf: HPacketField) => {
      addFieldConversion(pf);
    });
    this.packetUnitsConversion = tempMap;
  }
  getUnit(unit: string) {
    return this.unitConversionService.convert().describe(unit);
  }

  private getUnitOptions(unit: string): any[] {
    const measurement = this.getUnit(unit);
    const measurementUnit = UnitConversionService.measurements.find((m) => m.type === measurement.measure);
    const unitOptions = [];
    if (measurementUnit && measurementUnit.list) {
      unitOptions.push(...measurementUnit.list
        .map((u) => ({
          label: `${u.plural} (${u.abbr})`,
          value: u.abbr
        })).sort((a, b) => a.label < b.label ? -1 : 1)
      );
    }
    return unitOptions;
  }

  private syncFieldMapping() {
    if (!this.packetFieldsMapping) {
      this.packetFieldsMapping = [];
    }
    const tempMap = [] as FieldMatrixConfiguration[];
    this.selectedFields.map((pf: HPacketField) => {
      if (pf.multiplicity === HPacketField.MultiplicityEnum.ARRAY || pf.multiplicity === HPacketField.MultiplicityEnum.MATRIX) {
        const fieldMapping = this.packetFieldsMapping.find((f) => f.field.id === pf.id);
        if (!fieldMapping) {
          const af = new FieldMatrixConfiguration();
          af.field = {id: pf.id, name: pf.name};
          af.map = [] as FieldMatrixMapItem[];
          tempMap.push(af);
        } else {
          fieldMapping.field.name = pf.name;
          tempMap.push(fieldMapping);
        }
      }
    });
    this.packetFieldsMapping = tempMap;
  }

}