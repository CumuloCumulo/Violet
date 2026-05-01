import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('只能上传图片文件'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择图片文件');
    }
    const avatarPath = `/uploads/avatars/${file.filename}`;
    return this.userService.updateAvatar(req.user.userId, avatarPath);
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
