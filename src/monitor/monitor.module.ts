import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MqttModule } from 'src/mqtt/mqtt.module';

@Module({
  providers: [MonitorService],
  imports: [MqttModule],
})
export class MonitorModule {}
