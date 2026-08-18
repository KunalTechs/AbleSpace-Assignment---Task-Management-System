'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { ShieldCheck, Copy, CopyCheck, ArrowLeft, Loader2, KeyRound, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // View state: 'default' | 'google-options' | 'google-prompt' | 'register' | 'signin' | 'mfa-setup' | 'mfa-login'
  const [mode, setMode] = useState<'default' | 'google-options' | 'google-prompt' | 'register' | 'signin' | 'mfa-setup' | 'mfa-login'>('default');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // MFA Setup Payload
  const [tempUserId, setTempUserId] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleSuccessfulAuth = (accessToken: string, user: any) => {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('user_profile', JSON.stringify(user));
    router.push('/tasks');
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/guest-login');
      if (res.data?.accessToken) {
        handleSuccessfulAuth(res.data.accessToken, res.data.user);
      }
    } catch (err: any) {
      console.error('Guest login error:', err);
      setError('Guest login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccountSelect = async (selectedEmail: string, name?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/google', {
        email: selectedEmail,
        fullName: name || selectedEmail.split('@')[0],
        googleId: `google_${Date.now()}`,
      });

      if (res.data?.mfaSetupRequired) {
        setTempUserId(res.data.tempUserId);
        setMfaSecret(res.data.secret);
        setQrCodeUrl(res.data.qrCodeUrl);
        setOtpCode('');
        setMode('mfa-setup');
      } else if (res.data?.mfaRequired) {
        setTempUserId(res.data.tempUserId);
        setOtpCode('');
        setMode('mfa-login');
      } else if (res.data?.accessToken) {
        handleSuccessfulAuth(res.data.accessToken, res.data.user);
      }
    } catch (err: any) {
      console.error('Google Auth Failed:', err);
      setError(err.response?.data?.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/register', {
        email,
        password,
        fullName,
      });

      setTempUserId(res.data.tempUserId);
      setMfaSecret(res.data.secret);
      setQrCodeUrl(res.data.qrCodeUrl);
      setMode('mfa-setup');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSetupVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit code from Google Authenticator.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/mfa/verify-setup', {
        tempUserId,
        code: otpCode.trim(),
      });

      if (res.data?.accessToken) {
        handleSuccessfulAuth(res.data.accessToken, res.data.user);
      }
    } catch (err: any) {
      console.error('MFA setup verification failed:', err);
      setError(err.response?.data?.message || 'Invalid Google Authenticator code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', {
        email,
        password,
      });

      if (res.data?.mfaRequired) {
        setTempUserId(res.data.tempUserId);
        setMode('mfa-login');
      } else if (res.data?.accessToken) {
        handleSuccessfulAuth(res.data.accessToken, res.data.user);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit code from Google Authenticator.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/mfa/verify-login', {
        tempUserId,
        code: otpCode.trim(),
      });

      if (res.data?.accessToken) {
        handleSuccessfulAuth(res.data.accessToken, res.data.user);
      }
    } catch (err: any) {
      console.error('MFA login verification failed:', err);
      setError(err.response?.data?.message || 'Invalid 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  const copySecretToClipboard = () => {
    navigator.clipboard.writeText(mfaSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] dark:bg-zinc-950 p-4 select-none font-sans">
      
      {/* Top Logo Header (Matches Figma Blocks / Login-01) */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2, 22 21, 2 21" />
          </svg>
        </div>
        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">Pyramid</span>
      </div>

      {/* Main Card (Matches Figma Blocks / Login-01) */}
      <div className="w-full max-w-[380px] rounded-2xl bg-white dark:bg-zinc-900 px-8 py-10 shadow-sm border border-zinc-200/70 dark:border-zinc-800 text-center animate-in fade-in-50">
        
        {/* Title & Subtitle */}
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">
          {mode === 'mfa-setup'
            ? 'Setup 2FA'
            : mode === 'mfa-login'
            ? 'Two-Factor Auth'
            : mode === 'register'
            ? 'Create an Account'
            : mode === 'signin'
            ? 'Sign In to Account'
            : mode === 'google-prompt'
            ? 'Choose a Google Account'
            : "Let's get back on track"}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          {mode === 'mfa-setup'
            ? 'Scan the QR Code using Google Authenticator on your phone.'
            : mode === 'mfa-login'
            ? 'Enter the 6-digit code from Google Authenticator.'
            : mode === 'register'
            ? 'Enter your details below to register with 2FA.'
            : mode === 'signin'
            ? 'Enter your email & password to sign in.'
            : mode === 'google-prompt'
            ? 'Select a Google account to continue to AbleSpace Task Manager.'
            : 'Enter your email below to login to your account.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium text-left">
            ⚠️ {error}
          </div>
        )}

        {/* 1. DEFAULT FIGMA VIEW */}
        {mode === 'default' && (
          <div className="space-y-3">
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 py-2.5 text-xs font-semibold text-white dark:text-zinc-900 transition hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Entering as Guest...' : 'Continue as Guest'}</span>
            </button>

            <button
              onClick={() => {
                setError(null);
                setMode('google-options');
              }}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Login with Google</span>
            </button>
          </div>
        )}

        {/* 2. GOOGLE OPTIONS MODAL */}
        {mode === 'google-options' && (
          <div className="space-y-3 animate-in fade-in-50">
            <button
              onClick={() => {
                setError(null);
                setMode('google-prompt');
              }}
              className="flex w-full items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition text-left group"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">Sign in with Google</span>
                  <span className="block text-[10px] text-zinc-400">Direct Google 1-Click Login</span>
                </div>
              </div>
              <LogIn className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition" />
            </button>

            <button
              onClick={() => {
                setError(null);
                setMode('register');
              }}
              className="flex w-full items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 transition text-left group"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">Register New User</span>
                  <span className="block text-[10px] text-zinc-500">Includes Google Authenticator 2FA</span>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-primary" />
            </button>

            <button
              onClick={() => {
                setError(null);
                setMode('signin');
              }}
              className="w-full py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
            >
              Sign In with Email & Password
            </button>

            <button
              type="button"
              onClick={() => setMode('default')}
              className="flex items-center justify-center gap-1 w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        )}

        {/* 3. GOOGLE ACCOUNT SELECTOR PROMPT */}
        {mode === 'google-prompt' && (
          <div className="space-y-3 animate-in fade-in-50 text-left">
            <div className="space-y-2">
              <button
                onClick={() => handleGoogleAccountSelect('dexter.morgan@gmail.com', 'Dexter Morgan')}
                disabled={loading}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                  D
                </div>
                <div className="truncate text-left">
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">Dexter Morgan</span>
                  <span className="block text-[10px] text-zinc-500 truncate">dexter.morgan@gmail.com</span>
                </div>
              </button>

              <button
                onClick={() => handleGoogleAccountSelect('ankit.dutta@gmail.com', 'Ankit Dutta')}
                disabled={loading}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                  A
                </div>
                <div className="truncate text-left">
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">Ankit Dutta</span>
                  <span className="block text-[10px] text-zinc-500 truncate">ankit.dutta@gmail.com</span>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Or enter custom Google email:</label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) handleGoogleAccountSelect(email);
                }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  required
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? '...' : 'Sign In'}
                </button>
              </form>
            </div>

            <button
              type="button"
              onClick={() => setMode('google-options')}
              className="flex items-center justify-center gap-1 w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        )}

        {/* 4. SIGN IN MODE */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-3 text-left animate-in fade-in-50">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 py-2.5 text-xs font-semibold text-white dark:text-zinc-900 transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('default')}
              className="flex items-center justify-center gap-1 w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </form>
        )}

        {/* 5. REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left animate-in fade-in-50">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dexter Morgan"
                required
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 py-2.5 text-xs font-semibold text-white dark:text-zinc-900 transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Creating Account...' : 'Continue to 2FA Setup →'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('default')}
              className="flex items-center justify-center gap-1 w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </form>
        )}

        {/* 6. MFA SETUP MODE */}
        {mode === 'mfa-setup' && (
          <div className="space-y-4 text-left animate-in fade-in-50">
            <div className="flex items-center justify-center">
              {qrCodeUrl && (
                <div className="p-3 bg-white border border-zinc-200 rounded-2xl shadow-md inline-block">
                  <img src={qrCodeUrl} alt="Google Authenticator QR Code" className="w-40 h-40" />
                </div>
              )}
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1">
              <span className="text-[11px] text-zinc-400 font-medium block">Secret Key (if manual setup)</span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">{mfaSecret}</code>
                <button
                  type="button"
                  onClick={copySecretToClipboard}
                  className="p-1 text-primary hover:opacity-80 transition"
                  title="Copy secret"
                >
                  {copiedSecret ? <CopyCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleMfaSetupVerify} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  6-Digit Google Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full px-3.5 py-2.5 text-center tracking-[0.4em] font-mono text-base font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{loading ? 'Verifying Code...' : 'Verify & Enable 2FA'}</span>
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMode('register')}
              className="flex items-center justify-center gap-1.5 w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Register
            </button>
          </div>
        )}

        {/* 7. MFA LOGIN MODE */}
        {mode === 'mfa-login' && (
          <div className="space-y-4 text-left animate-in fade-in-50">
            <div className="flex items-center justify-center text-primary py-2">
              <KeyRound className="w-12 h-12 stroke-[1.5]" />
            </div>

            <form onSubmit={handleMfaLoginVerify} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  6-Digit Google Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 text-center tracking-[0.4em] font-mono text-base font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 py-2.5 text-xs font-semibold text-white dark:text-zinc-900 transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{loading ? 'Verifying...' : 'Verify Code & Sign In'}</span>
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMode('signin')}
              className="flex items-center justify-center gap-1.5 w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </div>
        )}

        {/* Footer Legal Terms */}
        <p className="mt-8 text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
          By clicking continue, you agree to our{' '}
          <a href="#" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
