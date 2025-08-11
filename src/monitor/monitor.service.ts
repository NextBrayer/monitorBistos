import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as hl7 from 'simple-hl7';
import { MqttService } from '../mqtt/mqtt.service';
import { ALL } from 'dns';

@Injectable()
export class MonitorService implements OnModuleInit, OnModuleDestroy {
  private server;
  private readonly logger = new Logger(MonitorService.name);

  constructor(private readonly mqttService: MqttService) {}

  private parseHL7Message(msg) {
    const msh = msg.getSegment('MSH');
    const pid = msg.getSegment('PID');
    const obr = msg.getSegment('OBR');
    this.logger.log('****** parsing message ******');

    const timestamp = msh?.getField(7) || obr?.getField(7) || null;

    // Extract patient name components from PID-5 and combine them
    const patientLastName = pid?.getComponent(5, 1);
    const patientFirstName = pid?.getComponent(5, 2);
    const patientName =
      patientFirstName || patientLastName
        ? `${patientFirstName || ''} ${patientLastName || ''}`.trim()
        : null;

    // Initialize the base structure for our JSON output
    const parsed = {
      timestamp: timestamp,
      type: obr?.getField(4) || null,
      patientId: pid?.getComponent(3, 1) || null,
      patientName: patientName,
      patientSex: pid?.getField(8) || null,
      observations: [],
      alarms: [],
    };

    const obxSegments = msg.getSegments('OBX');
    for (const obx of obxSegments) {
      const id = obx.getComponent(3, 1);
      const label = obx.getComponent(3, 2);
      const value = obx.getField(5);
      const units = obx.getComponent(6, 2);
      const valueType = obx.getField(2);
      const status = obx.getField(11);
      const alarmFlag = obx.getField(8);

      const obxObj = {
        id,
        label,
        value,
        units,
        valueType,
        status,
        alarmFlag,
      };

      // Keep all values, but skip only if truly empty/null

      // Determine if it’s an alarm
      const isAlarm =
        valueType === 'TX' ||
        label?.toLowerCase().includes('alert') ||
        label?.toLowerCase().includes('priority') ||
        (alarmFlag && alarmFlag.trim() !== '');

      if (!isAlarm) {
        parsed.observations.push(obxObj);
      } else parsed.alarms.push(obxObj);
    }

    return parsed;
  }

  onModuleInit() {
    this.server = hl7.tcp();

    this.server.use((req, res, next) => {
      this.logger.log('Incoming HL7 message received! 📥');
      this.logger.log(req.msg.log());

      try {
        const parsed = this.parseHL7Message(req.msg);
        this.logger.log('Parsed JSON data:');
        this.logger.log(JSON.stringify(parsed, null, 2));

        // Publish parsed JSON via MQTT
        this.mqttService.publishState(JSON.stringify(parsed));
      } catch (err) {
        this.logger.error('Error parsing HL7 message:', err);
      }

      res.end();
    });

    this.server.on('error', (err) => {
      this.logger.error('HL7 server error: ❌', err);
    });

    try {
      this.server.start(2528);
      this.logger.log('HL7 server started and listening on port 2528... ✅');
    } catch (err) {
      this.logger.error('Failed to start HL7 server: 🛑', err);
    }
  }

  onModuleDestroy() {
    if (this.server) {
      this.server.close();
      this.logger.log('HL7 server shut down. 🛑');
    }
  }
}
