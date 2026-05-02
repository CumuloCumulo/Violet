import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
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
import * as path from 'path';
import * as fs from 'fs/promises';

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
      wechat?: string;
      qq?: string;
      phone?: string;
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

  @Post('card-image')
  @UseInterceptors(
    FileInterceptor('cardImage', {
      limits: { fileSize: 5 * 1024 * 1024 },
      dest: path.join(process.cwd(), '..', 'uploads', 'cards'),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('只能上传图片文件'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadCardImage(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择图片文件');
    }
    // Rename with extension
    const ext = path.extname(file.originalname) || '.jpg';
    const newName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const cardsDir = path.join(process.cwd(), '..', 'uploads', 'cards');
    const newPath = path.join(cardsDir, newName);
    await fs.rename(file.path, newPath);
    const cardImagePath = `/uploads/cards/${newName}`;
    return this.userService.updateCardImage(req.user.userId, cardImagePath);
  }

  @Delete('card-image')
  async deleteCardImage(@Req() req: any) {
    return this.userService.deleteCardImage(req.user.userId);
  }
}
