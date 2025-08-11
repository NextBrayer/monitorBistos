import { Module } from '@nestjs/common';
import { MqttModule } from './mqtt/mqtt.module';
import { MonitorModule } from './monitor/monitor.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [MqttModule, MonitorModule, QueueModule]
})
export class AppModule {}
