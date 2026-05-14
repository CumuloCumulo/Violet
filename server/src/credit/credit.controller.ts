import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { CreditService } from './credit.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('credit')
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(private creditService: CreditService) {}

  @Get('balance')
  async getBalance(@Req() req: any) {
    const balance = await this.creditService.getBalance(req.user.userId);
    return { balance };
  }

  @Get('checkin/status')
  async getCheckinStatus(@Req() req: any) {
    return this.creditService.getCheckinStatus(req.user.userId);
  }

  @Post('checkin')
  async checkin(@Req() req: any) {
    return this.creditService.checkin(req.user.userId);
  }
}
