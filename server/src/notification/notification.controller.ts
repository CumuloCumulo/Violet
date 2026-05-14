import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Req() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id ?? req.headers['x-user-id'];
    return this.notificationService.getNotifications(
      userId,
      cursor,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const userId = req.user?.id ?? req.headers['x-user-id'];
    return this.notificationService.getUnreadCount(userId);
  }

  @Put(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id ?? req.headers['x-user-id'];
    return this.notificationService.markAsRead(id, userId);
  }

  @Put('read-all')
  async markAllAsRead(@Req() req: any) {
    const userId = req.user?.id ?? req.headers['x-user-id'];
    return this.notificationService.markAllAsRead(userId);
  }
}
