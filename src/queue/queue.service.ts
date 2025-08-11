import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly filePath = 'queue.json';
  private messages: string[] = [];

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile() {
    if (existsSync(this.filePath)) {
      try {
        const data = readFileSync(this.filePath, 'utf8');
        this.messages = JSON.parse(data);
        this.logger.log(
          `Loaded ${this.messages.length} queued messages from file`,
        );
      } catch (error) {
        this.logger.error('Error reading queue file:', error.message);
        this.messages = [];
      }
    }
  }

  private saveToFile() {
    try {
      writeFileSync(
        this.filePath,
        JSON.stringify(this.messages, null, 2),
        'utf8',
      );
    } catch (error) {
      this.logger.error('Error saving queue file:', error.message);
    }
  }

  push(message: string) {
    this.messages.push(message);
    this.saveToFile();
  }

  popAll(): string[] {
    const all = [...this.messages];
    this.messages = [];
    this.saveToFile();
    return all;
  }

  size(): number {
    return this.messages.length;
  }
}
