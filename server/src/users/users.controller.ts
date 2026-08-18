import { Controller, Get, Patch, Body, Request } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get('me')
  async getProfile(@Request() req: any) {
    const userId = req.user?.id || req.headers['x-user-id'];
    const email = req.user?.email || req.headers['x-user-email'];
    return this.usersService.getProfile(userId, email);
  }

  @Patch('me')
  async updateProfile(@Request() req: any, @Body() body: any) {
    const userId = req.user?.id || req.headers['x-user-id'];
    const email = req.user?.email || req.headers['x-user-email'];
    return this.usersService.updateProfile(userId, email, body);
  }
}