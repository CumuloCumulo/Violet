import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export class TestApp {
  app: INestApplication;
  prisma: PrismaService;

  static async create(): Promise<TestApp> {
    process.env['CORS_ORIGIN'] = '*';

    const testApp = new TestApp();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    testApp.app = moduleFixture.createNestApplication();
    testApp.app.enableCors({
      origin: '*',
      credentials: true,
    });
    testApp.app.setGlobalPrefix('api');
    testApp.prisma = testApp.app.get(PrismaService);

    await testApp.app.init();
    await testApp.app.listen(0);
    return testApp;
  }

  async cleanup() {
    // Clean up test data in reverse dependency order
    await this.prisma.message.deleteMany({});
    await this.prisma.rating.deleteMany({});
    await this.prisma.wingmanAssignment.deleteMany({});
    await this.prisma.wingmanTask.deleteMany({});
    await this.prisma.postReply.deleteMany({});
    await this.prisma.post.deleteMany({});
    await this.prisma.relationship.deleteMany({});
    await this.prisma.user.deleteMany({});
  }

  async close() {
    await this.cleanup();
    await this.app.close();
  }

  getUrl(): string {
    const address = this.app.getHttpServer().address() as any;
    return `http://localhost:${address.port}`;
  }
}
