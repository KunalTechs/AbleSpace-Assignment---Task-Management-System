import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest-login')
  async guestLogin() {
    return this.authService.guestLogin();
  }

  @Post('register')
  async register(@Body() data: { email: string; password?: string; fullName: string }) {
    return this.authService.register(data);
  }

  @Post('mfa/verify-setup')
  async verifyMfaSetup(@Body() data: { tempUserId: string; code: string }) {
    return this.authService.verifyMfaSetup(data.tempUserId, data.code);
  }

  @Post('login')
  async login(@Body() data: { email: string; password?: string }) {
    return this.authService.login(data);
  }

  @Post('mfa/verify-login')
  async verifyMfaLogin(@Body() data: { tempUserId: string; code: string }) {
    return this.authService.verifyMfaLogin(data.tempUserId, data.code);
  }

  @Post('google')
  async googleAuth(@Body() data: { email: string; fullName?: string; googleId?: string; avatarUrl?: string }) {
    return this.authService.googleAuth(data);
  }
}