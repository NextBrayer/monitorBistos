import { Injectable } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { Logger } from '@nestjs/common';
@Injectable()
export class MqttService {
  private logger = new Logger('NETWORK');
  private mqttClient;
  private topic;
  private port;
  private broker;
  private isConnected: boolean;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {
    this.broker = 'localhost';
    this.topic = '1883';
    this.topic = 'data';
    this.port = undefined;
    this.connect('localhost', 'data', 1883);
  }

  connect(broker: string, topic: string, port: number) {
    if (this.broker !== broker || this.topic !== topic || this.port !== port) {
      this.broker = broker;
      this.port = port;
      this.topic = topic;
      this.isConnected = false;
      try {
        this.mqttClient = mqtt.connect(`mqtt://${broker}`);
        this.mqttClient.on('connect', this.onMqttConnect.bind(this));
        this.mqttClient.on('disconnect', this.onMqttDisConnect.bind(this));
        this.mqttClient.on('message', this.onMqttMessage.bind(this));
      } catch (error) {
        this.logger.log(error);
      }
    }
  }
  reconnect() {
    try {
      this.mqttClient = mqtt.connect(`mqtt://${this.broker}`);
      this.mqttClient.on('connect', this.onMqttConnect.bind(this));
      this.mqttClient.on('disconnect', this.onMqttDisConnect.bind(this));
      this.mqttClient.on('message', this.onMqttMessage.bind(this));
    } catch (error) {
      this.logger.log(error);
    }
  }
  onMqttMessage(data) {
    this.logger.log(data);
  }

  onMqttConnect() {
    this.isConnected = true;
    this.logger.log('Connected');
  }

  onMqttDisConnect() {
    this.isConnected = false;
    this.logger.log('DisConnected');
  }

  publishState(data: string) {
    if (this.isConnected) {
      this.mqttClient = this.mqttClient.publish(this.topic, data);
    }
  }
}
