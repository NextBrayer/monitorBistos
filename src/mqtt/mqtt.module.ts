import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  providers: [MqttService],
  exports: [MqttService],
  imports: [QueueModule],
})
export class MqttModule {}
