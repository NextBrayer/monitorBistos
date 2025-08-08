import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as hl7 from 'simple-hl7';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class MonitorService implements OnModuleInit, OnModuleDestroy {
  private server;

  constructor(private readonly mqttService: MqttService) {}
  onModuleInit() {
    this.server = hl7.tcp();

    this.server.use((req, res, next) => {
      console.log('Incoming HL7 message received! 📥');
      //   console.log(req.msg.log());
      this.mqttService.publishState(req.msg.log());
      res.end();
    });

    this.server.on('error', (err) => {
      console.error('HL7 server error: ❌', err);
    });

    try {
      this.server.start(2528);
      console.log('HL7 server started and listening on port 2528... ✅');
    } catch (err) {
      console.error('Failed to start HL7 server: 🛑', err);
    }
  }

  onModuleDestroy() {
    if (this.server) {
      this.server.close();
      console.log('HL7 server shut down. 🛑');
    }
  }
}
