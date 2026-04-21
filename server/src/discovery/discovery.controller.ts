import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DiscoveryService } from './discovery.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private discoveryService: DiscoveryService) {}

  @Get('users')
  async listUsers(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.discoveryService.listUsers(
      req.user.userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Post('match-request')
  async sendMatchRequest(@Req() req: any, @Body() body: { toUserId: string }) {
    return this.discoveryService.sendMatchRequest(
      req.user.userId,
      body.toUserId,
    );
  }

  @Get('match-requests/sent')
  async getSentRequests(@Req() req: any) {
    return this.discoveryService.getSentRequests(req.user.userId);
  }

  @Get('match-requests/received')
  async getReceivedRequests(@Req() req: any) {
    return this.discoveryService.getReceivedRequests(req.user.userId);
  }

  @Post('match-request/:id/accept')
  async acceptMatchRequest(@Req() req: any, @Param('id') id: string) {
    return this.discoveryService.acceptMatchRequest(id, req.user.userId);
  }

  @Post('match-request/:id/reject')
  async rejectMatchRequest(@Req() req: any, @Param('id') id: string) {
    return this.discoveryService.rejectMatchRequest(id, req.user.userId);
  }
}
