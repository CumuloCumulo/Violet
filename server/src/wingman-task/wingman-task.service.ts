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
    // Verify the relationship exists and user is a member
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundException('关系不存在');
    }

    if (relationship.user1Id !== clientId && relationship.user2Id !== clientId) {
      throw new ForbiddenException('你不是该关系的当事人');
    }

    if (relationship.status !== 'ICEBREAKING') {
      throw new BadRequestException('只有在破冰期才能发布军师任务');
    }

    // Determine which side the client is on
    const side = relationship.user1Id === clientId ? 1 : 2;

    // Check for existing OPEN task on the same side
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

    // Check if side already has a wingman
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
    return this.prisma.wingmanTask.findMany({
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
      },
    });
  }

  async listTasksByRelationship(relationshipId: string) {
    return this.prisma.wingmanTask.findMany({
      where: { relationshipId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, nickname: true },
        },
        wingman: {
          select: { id: true, nickname: true, interests: true },
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
      throw new ConflictException('该任务已被申请');
    }

    // Verify wingman certification
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

    return this.prisma.wingmanTask.update({
      where: { id: taskId },
      data: { status: 'ASSIGNED', wingmanId },
    });
  }

  async approveTask(taskId: string, clientId: string) {
    const task = await this.prisma.wingmanTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.clientId !== clientId) {
      throw new ForbiddenException('只有发布者才能审批');
    }

    if (task.status !== 'ASSIGNED' || !task.wingmanId) {
      throw new BadRequestException('该任务没有待审批的申请');
    }

    // Get relationship to determine side
    if (!task.relationshipId) {
      throw new BadRequestException('任务未关联关系');
    }

    const relationship = await this.prisma.relationship.findUnique({
      where: { id: task.relationshipId },
    });

    if (!relationship) {
      throw new NotFoundException('关联关系不存在');
    }

    const side = relationship.user1Id === clientId ? 1 : 2;

    // Create WingmanAssignment and update task in transaction
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.wingmanAssignment.create({
        data: {
          relationshipId: task.relationshipId!,
          userId: task.wingmanId!,
          side,
          mode: 'PRIVATE',
        },
      });

      const updatedTask = await tx.wingmanTask.update({
        where: { id: taskId },
        data: { status: 'IN_PROGRESS' },
      });

      return { task: updatedTask, assignment };
    });
  }

  async rejectTask(taskId: string, clientId: string) {
    const task = await this.prisma.wingmanTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.clientId !== clientId) {
      throw new ForbiddenException('只有发布者才能拒绝');
    }

    if (task.status !== 'ASSIGNED') {
      throw new BadRequestException('该任务没有待审批的申请');
    }

    return this.prisma.wingmanTask.update({
      where: { id: taskId },
      data: { status: 'OPEN', wingmanId: null },
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

    // If task has an active wingman, remove their assignment
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
