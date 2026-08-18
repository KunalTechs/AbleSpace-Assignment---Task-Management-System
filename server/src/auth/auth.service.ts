import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async guestLogin() {
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

  async register(data: { email: string; password?: string; fullName: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing && existing.password) {
      throw new BadRequestException('User with this email already exists.');
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
    const mfaSecret = generateSecret();
    const otpAuthUrl = generateURI({
      secret: mfaSecret,
      label: data.email.toLowerCase(),
      issuer: 'AbleSpace Task Manager',
    });
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    let user;
    if (existing) {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          fullName: data.fullName,
          mfaSecret,
          isMfaEnabled: false,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          fullName: data.fullName,
          mfaSecret,
          isMfaEnabled: false,
        },
      });
    }

    return {
      tempUserId: user.id,
      email: user.email,
      secret: mfaSecret,
      qrCodeUrl,
    };
  }

  async verifyMfaSetup(tempUserId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: tempUserId } });
    if (!user || !user.mfaSecret) {
      throw new NotFoundException('User or MFA secret not found.');
    }

    const isValid = verify({
      token: code.trim(),
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 6-digit Google Authenticator code. Please try again.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { isMfaEnabled: true },
    });

    const payload = { sub: updatedUser.id, email: updatedUser.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: updatedUser,
    };
  }

  async login(data: { email: string; password?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.password && data.password) {
      const isMatch = await bcrypt.compare(data.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password.');
      }
    }

    if (user.isMfaEnabled) {
      return {
        mfaRequired: true,
        tempUserId: user.id,
        email: user.email,
      };
    }

    const payload = { sub: user.id, email: user.email };
    return {
      mfaRequired: false,
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async verifyMfaLogin(tempUserId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: tempUserId } });
    if (!user || !user.mfaSecret) {
      throw new NotFoundException('User or MFA secret not found.');
    }

    const isValid = verify({
      token: code.trim(),
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 6-digit Google Authenticator code.');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async googleAuth(data: { email: string; fullName?: string; googleId?: string; avatarUrl?: string }) {
    let user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      const mfaSecret = generateSecret();
      const otpAuthUrl = generateURI({
        secret: mfaSecret,
        label: data.email.toLowerCase(),
        issuer: 'AbleSpace Task Manager',
      });
      const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

      user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          fullName: data.fullName || 'Google User',
          googleId: data.googleId,
          avatarUrl: data.avatarUrl,
          mfaSecret,
          isMfaEnabled: false,
          isGuest: false,
        },
      });

      return {
        mfaSetupRequired: true,
        tempUserId: user.id,
        email: user.email,
        secret: mfaSecret,
        qrCodeUrl,
      };
    }

    if (data.googleId && !user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: data.googleId,
          avatarUrl: data.avatarUrl || user.avatarUrl,
        },
      });
    }

    if (user.isMfaEnabled) {
      return {
        mfaRequired: true,
        tempUserId: user.id,
        email: user.email,
      };
    }

    if (!user.mfaSecret) {
      const mfaSecret = generateSecret();
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { mfaSecret },
      });
    }

    const otpAuthUrl = generateURI({
      secret: user.mfaSecret!,
      label: user.email,
      issuer: 'AbleSpace Task Manager',
    });
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    return {
      mfaSetupRequired: true,
      tempUserId: user.id,
      email: user.email,
      secret: user.mfaSecret,
      qrCodeUrl,
    };
  }
}