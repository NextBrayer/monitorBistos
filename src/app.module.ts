import { Module } from '@nestjs/common';
import { MqttModule } from './mqtt/mqtt.module';
import { MonitorModule } from './monitor/monitor.module';

@Module({
  imports: [MqttModule, MonitorModule]
})
export class AppModule {}
