'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, Camera, Trash2, Loader2 } from 'lucide-react';
import { useUser } from '@/components/providers/user-provider';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, updateUser } = useUser();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || 'dexter@gmail.com');
      setFullName(user.fullName || 'Dexter');
      setTitle(user.title || 'Designer');
      setUsername(user.username || 'Dexuser');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleSaveProfile = async (fieldOverrides: Record<string, any> = {}) => {
    try {
      setSaving(true);
      const payload = {
        fullName,
        title,
        username,
        email,
        avatarUrl,
        ...fieldOverrides,
      };
      await updateUser(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setAvatarUrl(base64String);
      await handleSaveProfile({ avatarUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    await handleSaveProfile({ avatarUrl: '' });
  };

  const handleLeaveWorkspace = () => {
    if (!confirm('Are you sure you want to leave this workspace?')) return;
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  if (loading) {
    return <div className="text-xs text-zinc-400 py-12">Loading profile settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in-50">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Profile</h1>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Profile Picture */}
        <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">Profile picture</span>
            <span className="text-[11px] text-zinc-400">PNG, JPG or GIF up to 5MB</span>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-zinc-100 dark:ring-zinc-800"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-zinc-100 dark:ring-zinc-800">
                  {fullName ? fullName[0].toUpperCase() : 'D'}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition"
              >
                Change
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                  title="Remove picture"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800 pb-4 text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Email</span>
          {isEditingEmail ? (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-xs"
              />
              <button
                onClick={() => {
                  setIsEditingEmail(false);
                  handleSaveProfile({ email });
                }}
                className="p-1 text-primary hover:opacity-80"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500">
              <span>{email}</span>
              <button
                onClick={() => setIsEditingEmail(true)}
                className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => handleSaveProfile()}
            className="w-full px-3.5 py-2 text-xs bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-800 dark:text-zinc-200 transition"
          />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Title</label>
            <span className="block text-[11px] text-zinc-400">Your job title or role</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleSaveProfile()}
            className="w-full px-3.5 py-2 text-xs bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-800 dark:text-zinc-200 transition"
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Username</label>
            <span className="block text-[11px] text-zinc-400">One word, like a nickname or first name</span>
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => handleSaveProfile()}
            className="w-full px-3.5 py-2 text-xs bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-zinc-800 dark:text-zinc-200 transition"
          />
        </div>

        {/* Save Status & CTA */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-zinc-400">
            {saving ? 'Saving changes...' : savedSuccess ? '✓ Saved to database' : ''}
          </span>
          <button
            onClick={() => handleSaveProfile()}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 shadow-sm"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* Workspace Access */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Workspace access</h2>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <p className="text-xs text-zinc-500">Remove yourself from the workspace</p>
          <button
            onClick={handleLeaveWorkspace}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 text-red-600 text-xs font-semibold rounded-xl border border-red-200/80 dark:border-red-900/40 transition"
          >
            Leave Workspace
          </button>
        </div>
      </div>
    </div>
  );
}