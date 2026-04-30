import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { WingmanTaskService } from './wingman-task.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ChatGateway } from '../chat/chat.gateway.js';

@Controller('wingman-task')
@UseGuards(JwtAuthGuard)
export class WingmanTaskController {
  constructor(
    private wingmanTaskService: WingmanTaskService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  @Post()
  async createTask(
    @Req() req: any,
    @Body()
    body: { relationshipId: string; title: string; description: string },
  ) {
    return this.wingmanTaskService.createTask(
      req.user.userId,
      body.relationshipId,
      body.title,
      body.description,
    );
  }

  @Get()
  async listOpenTasks() {
    return this.wingmanTaskService.listOpenTasks();
  }

  @Get('by-relationship')
  async listByRelationship(
    @Req() req: any,
    @Query('relationshipId') relationshipId: string,
  ) {
    return this.wingmanTaskService.listTasksByRelationship(
      relationshipId,
      req.user.userId,
    );
  }

  @Post(':id/apply')
  async applyForTask(@Req() req: any, @Param('id') id: string) {
    return this.wingmanTaskService.applyForTask(id, req.user.userId);
  }

  @Post(':id/approve')
  async approveTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { wingmanId: string },
  ) {
    const result = await this.wingmanTaskService.approveTask(
      id,
      req.user.userId,
      body.wingmanId,
    );

    // Push real-time notifications
    try {
      await this.chatGateway.emitWingmanAssigned(
        result.assignment.relationshipId,
        req.user.userId,
        body.wingmanId,
        result.assignment.side,
        result.assignment.mode,
      );
      await this.chatGateway.emitWingmanApproved(
        result.assignment.relationshipId,
        body.wingmanId,
        result.assignment.side,
        result.assignment.mode,
      );
    } catch {
      // WebSocket notification failure should not block approval
    }

    return result;
  }

  @Post(':id/reject')
  async rejectApplication(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { wingmanId: string },
  ) {
    return this.wingmanTaskService.rejectApplication(
      id,
      req.user.userId,
      body.wingmanId,
    );
  }

  @Delete(':id')
  async cancelTask(@Req() req: any, @Param('id') id: string) {
    return this.wingmanTaskService.cancelTask(id, req.user.userId);
  }
}
