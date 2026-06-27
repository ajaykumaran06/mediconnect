import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Phone, Globe, Lock, Save, Loader2, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Profile form state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: '',
    language: 'en',
  });

  // Password form state
  const [passwords, setPasswords] = useState({
    current: '',
    newPwd: '',
    confirm: '',
  });

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: () => api.put('/auth/profile', profile),
    onSuccess: (res) => {
      updateUser({ name: profile.name });
      toast.success('Profile updated');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed'),
  });

  const { mutate: changePassword, isPending: changingPwd } = useMutation({
    mutationFn: () =>
      api.put('/auth/password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPwd,
      }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswords({ current: '', newPwd: '', confirm: '' });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Password change failed'),
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPwd !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPwd.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    changePassword();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'language', label: 'Language', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
        </div>

        {/* Avatar + name hero */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full font-medium capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Personal Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
              <select
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm bg-white"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => saveProfile()}
              disabled={savingProfile}
              className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
            >
              {savingProfile ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : saved ? (
                <><CheckCircle className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        )}

        {/* Tab: Security */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {[
                { key: 'current', label: 'Current Password',  placeholder: 'Your current password' },
                { key: 'newPwd',  label: 'New Password',       placeholder: 'At least 8 characters' },
                { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="password"
                    value={passwords[key]}
                    onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                    required
                    minLength={key !== 'current' ? 8 : undefined}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={changingPwd}
                className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
              >
                {changingPwd ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                ) : (
                  <><Lock className="w-4 h-4" /> Update Password</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab: Language */}
        {activeTab === 'language' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Interface Language</h2>
            <p className="text-gray-500 text-sm mb-6">
              Choose the language for the MediConnect interface. Your medical records remain as entered.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LANGUAGES.slice(0, 4).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    import('../../lib/i18n').then(({ default: i18n }) => {
                      i18n.changeLanguage(lang.code);
                      localStorage.setItem('mc_language', lang.code);
                    });
                    toast.success(`Language set to ${lang.label}`);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <span className="text-2xl">🌐</span>
                  <span className="text-sm font-medium text-gray-700">{lang.label}</span>
                  <span className="text-xs text-gray-400">{lang.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              More languages coming soon. Want to help translate?
              Contact <a href="mailto:support@mediconnect.health" className="text-primary-600 hover:underline">support@mediconnect.health</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
