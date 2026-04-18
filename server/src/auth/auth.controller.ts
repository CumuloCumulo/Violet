import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; nickname: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(body);
    response.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body);
    response.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token');
    return { message: '已退出登录' };
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return this.authService.validateUser(req.user.userId);
  }
}
