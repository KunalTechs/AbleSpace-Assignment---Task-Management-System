import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async guestLogin() {
    // Check if default guest user exists or create one
    let user = await this.prisma.user.findFirst({
      where: { email: 'Dexter@gmail.com' },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'Dexter@gmail.com',
          fullName: 'Dexter',
          title: 'Designer',
          username: 'Dexuser',
          isGuest: true,
          colorMode: 'blue',
        },
      });
    }

    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}