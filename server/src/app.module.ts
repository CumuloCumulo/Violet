import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ChatModule } from './chat/chat.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { CreditModule } from './credit/credit.module.js';
import { DiscoveryModule } from './discovery/discovery.module.js';
import { AdminModule } from './admin/admin.module.js';
import { WingmanTaskModule } from './wingman-task/wingman-task.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { DevModule } from './dev/dev.module.js';

const devImports = process.env['NODE_ENV'] !== 'production' ? [DevModule] : [];

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    AuthModule,
    UserModule,
    CreditModule,
    DiscoveryModule,
    ChatModule,
    AdminModule,
    WingmanTaskModule,
    NotificationModule,
    ...devImports,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
