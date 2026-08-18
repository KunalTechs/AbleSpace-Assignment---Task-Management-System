import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.tasksService.findAll({ search, projectId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @Request() req: any) {
    const user = req.headers['x-user-email'] || req.headers['x-user-id'];
    return this.tasksService.create(data, user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    const user = req.headers['x-user-email'] || req.headers['x-user-id'];
    return this.tasksService.update(id, data, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = req.headers['x-user-email'] || req.headers['x-user-id'];
    return this.tasksService.remove(id, user);
  }

  @Post(':id/subtasks')
  async addSubtask(@Param('id') taskId: string, @Body() data: any) {
    return this.tasksService.addSubtask(taskId, data);
  }

  @Delete(':id/subtasks/:subtaskId')
  async deleteSubtask(
    @Param('id') taskId: string,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.tasksService.deleteSubtask(subtaskId);
  }

  @Post(':id/comments')
  async addComment(@Param('id') taskId: string, @Body() data: any) {
    return this.tasksService.addComment(taskId, data);
  }

  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Param('id') taskId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.tasksService.deleteComment(commentId);
  }

  @Post(':id/duplicate')
  async duplicateTask(@Param('id') id: string, @Request() req: any) {
    const user = req.headers['x-user-email'] || req.headers['x-user-id'];
    return this.tasksService.duplicate(id, user);
  }
}
