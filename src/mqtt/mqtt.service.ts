import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class MqttService implements OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private mqttClient: mqtt.MqttClient;
  private isConnected = false;

  private broker = '127.0.0.1';
  private port = 1883;
  private topic = 'data';

  constructor(private readonly queueService: QueueService) {
    this.connect();
  }

  private connect() {
    this.logger.log(`Connecting to MQTT broker: ${this.broker}:${this.port}`);
    this.mqttClient = mqtt.connect(`mqtt://${this.broker}:${this.port}`, {
      reconnectPeriod: 10000,
    });

    this.mqttClient.on('connect', () => {
      this.isConnected = true;
      this.logger.log('✅ Connected to MQTT broker');
      this.flushQueue();
    });

    this.mqttClient.on('close', () => {
      if (this.isConnected) {
        this.logger.warn('⚠️ MQTT connection lost');
      }
      this.isConnected = false;
    });

    this.mqttClient.on('error', (err) => {
      this.logger.error(`MQTT Error: ${err.message}`);
    });
  }

  private flushQueue() {
    const messages = this.queueService.popAll();
    if (messages.length > 0) {
      this.logger.log(`Flushing ${messages.length} queued messages...`);
      messages.forEach((msg) => this.publishState(msg));
    }
  }

  publishState(data: string) {
    if (!this.isConnected) {
      this.logger.warn('MQTT not connected → Queuing message');
      this.queueService.push(data);
      return;
    }

    this.mqttClient.publish(this.topic, data, (err) => {
      if (err) {
        this.logger.error(`Publish error: ${err.message} → Queuing`);
        this.queueService.push(data);
      } else this.logger.log('messege published successufuly');
    });
  }

  onModuleDestroy() {
    if (this.mqttClient) {
      this.mqttClient.end(true);
    }
  }
}
