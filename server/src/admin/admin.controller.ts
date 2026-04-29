import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminGuard } from './admin.guard.js';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  async listUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    return this.adminService.listUsers(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      search,
      active,
    );
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/credit')
  async adjustCredit(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.adminService.adjustCredit(
      req.user.userId,
      id,
      body.amount,
      body.reason,
    );
  }

  @Post('users/:id/toggle-active')
  async toggleActive(@Param('id') id: string) {
    return this.adminService.toggleActive(id);
  }
}
