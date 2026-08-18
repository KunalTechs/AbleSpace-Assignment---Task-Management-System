import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        title: true,
        username: true,
        avatarUrl: true,
      },
    });
  }

  async getProfile(userId?: string, email?: string) {
    let user;
    if (userId) {
      try {
        user = await this.prisma.user.findUnique({ where: { id: userId } });
      } catch (e) {}
    }
    if (!user && email) {
      user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    }
    if (!user) {
      user = await this.prisma.user.findFirst();
    }
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'dexter@gmail.com',
          fullName: 'Dexter',
          title: 'Designer',
          username: 'Dexuser',
          avatarUrl: '',
          theme: 'LIGHT',
          colorMode: 'blue',
        },
      });
    }
    return user;
  }

  async updateProfile(
    userId?: string,
    email?: string,
    data?: {
      fullName?: string;
      title?: string;
      username?: string;
      email?: string;
      avatarUrl?: string;
      theme?: 'LIGHT' | 'DARK';
      colorMode?: string;
    },
  ) {
    const user = await this.getProfile(userId, email);
    return this.prisma.user.update({
      where: { id: user.id },
      data: data || {},
    });
  }
}