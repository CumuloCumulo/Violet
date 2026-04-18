import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ChatModule } from './chat/chat.module.js';
import { DevModule } from './dev/dev.module.js';

const devImports = process.env['NODE_ENV'] !== 'production' ? [DevModule] : [];

@Module({
  imports: [ChatModule, ...devImports],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
