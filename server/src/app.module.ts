import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ChatModule } from './chat/chat.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { CreditModule } from './credit/credit.module.js';
import { DiscoveryModule } from './discovery/discovery.module.js';
import { AdminModule } from './admin/admin.module.js';
import { DevModule } from './dev/dev.module.js';

const devImports = process.env['NODE_ENV'] !== 'production' ? [DevModule] : [];

@Module({
  imports: [
    AuthModule,
    UserModule,
    CreditModule,
    DiscoveryModule,
    ChatModule,
    AdminModule,
    ...devImports,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
