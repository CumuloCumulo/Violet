import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
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
}
