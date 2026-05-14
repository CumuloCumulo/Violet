import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'] ?? 'smtpdm.aliyun.com',
      port: parseInt(process.env['SMTP_PORT'] ?? '465', 10),
      secure: process.env['SMTP_SECURE'] !== 'false',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }

  async sendVerificationCode(to: string, code: string) {
    const from = process.env['SMTP_FROM'] ?? process.env['SMTP_USER'];
    await this.transporter.sendMail({
      from: `Violet <${from}>`,
      to,
      subject: 'Violet 邮箱验证码',
      text: `您的验证码是：${code}，5 分钟内有效。如非本人操作请忽略。`,
    });
  }
}
