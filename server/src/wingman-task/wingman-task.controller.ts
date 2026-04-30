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
} from '@nestjs/common';
import { WingmanTaskService } from './wingman-task.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('wingman-task')
@UseGuards(JwtAuthGuard)
export class WingmanTaskController {
  constructor(private wingmanTaskService: WingmanTaskService) {}

  @Post()
  async createTask(
    @Req() req: any,
    @Body() body: { relationshipId: string; title: string; description: string },
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
  async listByRelationship(@Query('relationshipId') relationshipId: string) {
    return this.wingmanTaskService.listTasksByRelationship(relationshipId);
  }

  @Post(':id/apply')
  async applyForTask(@Req() req: any, @Param('id') id: string) {
    return this.wingmanTaskService.applyForTask(id, req.user.userId);
  }

  @Post(':id/approve')
  async approveTask(@Req() req: any, @Param('id') id: string) {
    return this.wingmanTaskService.approveTask(id, req.user.userId);
  }

  @Post(':id/reject')
  async rejectTask(@Req() req: any, @Param('id') id: string) {
    return this.wingmanTaskService.rejectTask(id, req.user.userId);
  }

  @Delete(':id')
  async cancelTask(@Req() req: any, @Param('id') id: string) {
    return this.wingmanTaskService.cancelTask(id, req.user.userId);
  }
}
