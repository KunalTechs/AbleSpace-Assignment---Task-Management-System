import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Theme } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(email = 'Dexter@gmail.com') {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updatePreferences(email: string, data: { theme?: Theme; colorMode?: string; fullName?: string; title?: string; username?: string }) {
    return this.prisma.user.update({
      where: { email },
      data,
    });
  }
}