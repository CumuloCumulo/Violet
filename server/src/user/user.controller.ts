import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.userId);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: any,
    @Body()
    body: {
      nickname?: string;
      avatar?: string;
      declaration?: string;
      interests?: string[];
      campus?: string;
      grade?: string;
      major?: string;
    },
  ) {
    return this.userService.updateProfile(req.user.userId, body);
  }

  @Post('wingman-certify')
  async certifyWingman(
    @Req() req: any,
    @Body()
    body: {
      moralAnswers: number[];
      characteristicAnswers: string[];
    },
  ) {
    return this.userService.certifyWingman(req.user.userId, body);
  }

  @Patch('password')
  async changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.userService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Patch('contact-email')
  async changeContactEmail(
    @Req() req: any,
    @Body() body: { newEmail: string },
  ) {
    return this.userService.changeContactEmail(req.user.userId, body.newEmail);
  }
}
