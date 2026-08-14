import { Controller, Get, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { Theme } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile() {
    return this.usersService.getProfile();
  }

  @Patch('preferences')
  updatePreferences(
    @Body() body: { email: string; theme?: Theme; colorMode?: string; fullName?: string; title?: string; username?: string },
  ) {
    return this.usersService.updatePreferences(body.email || 'Dexter@gmail.com', body);
  }
}