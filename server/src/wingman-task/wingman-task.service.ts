import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class WingmanTaskService {
  constructor(private prisma: PrismaService) {}

  async createTask(
    clientId: string,
    relationshipId: string,
    title: string,
    description: string,
  ) {
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundException('关系不存在');
    }

    if (
      relationship.user1Id !== clientId &&
      relationship.user2Id !== clientId
    ) {
      throw new ForbiddenException('你不是该关系的当事人');
    }

    if (relationship.status !== 'ICEBREAKING') {
      throw new BadRequestException('只有在破冰期才能发布军师任务');
    }

    const side = relationship.user1Id === clientId ? 1 : 2;

    const existing = await this.prisma.wingmanTask.findFirst({
      where: {
        clientId,
        relationshipId,
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
      },
    });

    if (existing) {
      throw new ConflictException('已有一条进行中的招募任务');
    }

    const existingAssignment = await this.prisma.wingmanAssignment.findFirst({
      where: {
        relationshipId,
        side,
        leftAt: null,
      },
    });

    if (existingAssignment) {
      throw new ConflictException('己方已有军师，请先请出当前军师');
    }

    return this.prisma.wingmanTask.create({
      data: {
        clientId,
        relationshipId,
        title,
        description,
        status: 'OPEN',
      },
    });
  }

  async listOpenTasks() {
    const tasks = await this.prisma.wingmanTask.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            gender: true,
            campus: true,
            grade: true,
            interests: true,
            declaration: true,
          },
        },
        applications: {
          where: { status: 'PENDING' },
          select: { id: true },
        },
      },
    });

    return tasks.map((t) => ({
      ...t,
      applicationCount: t.applications.length,
    }));
  }

  async listTasksByRelationship(relationshipId: string, clientId: string) {
    return this.prisma.wingmanTask.findMany({
      where: { relationshipId, clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, nickname: true },
        },
        wingman: {
          select: { id: true, nickname: true, interests: true },
        },
        applications: {
          include: {
            wingman: {
              select: { id: true, nickname: true, interests: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async applyForTask(taskId: string, wingmanId: string) {
    const task = await this.prisma.wingmanTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.status !== 'OPEN') {
      throw new ConflictException('该任务已不可申请');
    }

    const wingman = await this.prisma.user.findUnique({
      where: { id: wingmanId },
      select: { wingmanCertStatus: true, roles: true },
    });

    if (!wingman || !wingman.roles.includes('WINGMAN')) {
      throw new ForbiddenException('你不是军师');
    }

    if (wingman.wingmanCertStatus !== 'APPROVED') {
      throw new ForbiddenException('军师认证未通过');
    }

    // Wingman cannot apply for their own client's task
    if (task.clientId === wingmanId) {
      throw new ForbiddenException('不能申请自己发布的任务');
    }

    // Check duplicate application
    const existingApp = await this.prisma.wingmanApplication.findUnique({
      where: { taskId_wingmanId: { taskId, wingmanId } },
    });

    if (existingApp) {
      throw new ConflictException('你已经申请过该任务');
    }

    return this.prisma.wingmanApplication.create({
      data: {
        taskId,
        wingmanId,
        status: 'PENDING',
      },
    });
  }

  async approveTask(taskId: string, clientId: string, wingmanId: string) {
    const task = await this.prisma.wingmanTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.clientId !== clientId) {
      throw new ForbiddenException('只有发布者才能审批');
    }

    if (task.status !== 'OPEN') {
      throw new BadRequestException('该任务已不可审批');
    }

    if (!task.relationshipId) {
      throw new BadRequestException('任务未关联关系');
    }

    const application = await this.prisma.wingmanApplication.findUnique({
      where: { taskId_wingmanId: { taskId, wingmanId } },
    });

    if (!application || application.status !== 'PENDING') {
      throw new BadRequestException('该申请不存在或已处理');
    }

    const relationship = await this.prisma.relationship.findUnique({
      where: { id: task.relationshipId },
    });

    if (!relationship) {
      throw new NotFoundException('关联关系不存在');
    }

    const side = relationship.user1Id === clientId ? 1 : 2;

    return this.prisma.$transaction(async (tx) => {
      // Approve this application
      await tx.wingmanApplication.update({
        where: { id: application.id },
        data: { status: 'APPROVED' },
      });

      // Reject all other pending applications
      await tx.wingmanApplication.updateMany({
        where: {
          taskId,
          status: 'PENDING',
          id: { not: application.id },
        },
        data: { status: 'REJECTED' },
      });

      // Create WingmanAssignment
      const assignment = await tx.wingmanAssignment.create({
        data: {
          relationshipId: task.relationshipId!,
          userId: wingmanId,
          side,
          mode: 'PRIVATE',
        },
      });

      // Update task
      const updatedTask = await tx.wingmanTask.update({
        where: { id: taskId },
        data: { status: 'IN_PROGRESS', wingmanId },
      });

      return { task: updatedTask, assignment };
    });
  }

  async rejectApplication(
    taskId: string,
    clientId: string,
    wingmanId: string,
  ) {
    const task = await this.prisma.wingmanTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.clientId !== clientId) {
      throw new ForbiddenException('只有发布者才能拒绝');
    }

    const application = await this.prisma.wingmanApplication.findUnique({
      where: { taskId_wingmanId: { taskId, wingmanId } },
    });

    if (!application || application.status !== 'PENDING') {
      throw new BadRequestException('该申请不存在或已处理');
    }

    return this.prisma.wingmanApplication.update({
      where: { id: application.id },
      data: { status: 'REJECTED' },
    });
  }

  async cancelTask(taskId: string, clientId: string) {
    const task = await this.prisma.wingmanTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.clientId !== clientId) {
      throw new ForbiddenException('只有发布者才能取消');
    }

    if (task.status === 'CANCELLED') {
      throw new BadRequestException('任务已取消');
    }

    if (task.wingmanId && task.relationshipId) {
      await this.prisma.wingmanAssignment.updateMany({
        where: {
          relationshipId: task.relationshipId,
          userId: task.wingmanId,
          leftAt: null,
        },
        data: { leftAt: new Date() },
      });
    }

    return this.prisma.wingmanTask.update({
      where: { id: taskId },
      data: { status: 'CANCELLED' },
    });
  }
}
