import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getInitials } from '../../utils/helpers';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi';

const Settings = () => {
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState({ name: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name });
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put('/settings/profile', { name: profile.name });
      toast.success('Profile updated');
      checkAuth();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwords.newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    setLoading(true);
    try {
      await API.put('/settings/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to change'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div>
        <p className="label-inst text-cardinal-700">Account</p>
        <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Settings</h1>
        <div className="divider-gold mt-3 max-w-[120px]" />
        <p className="text-sm text-gray-500 mt-3">Manage your profile and security credentials.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* ── Profile ── */}
        <section className="surface-card p-7">
          <div className="flex items-center gap-4 pb-5 mb-5 border-b border-gray-200">
            <div className="w-16 h-16 rounded-full bg-cardinal-50 border border-cardinal-100 flex items-center justify-center
                            text-cardinal-700 font-serif font-bold text-2xl">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-xl font-semibold text-gray-900 truncate">{user?.name}</h2>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <p className="label-inst text-cardinal-700 mt-1">{user?.role}</p>
            </div>
          </div>

          <div className="mb-5">
            <p className="label-inst text-cardinal-700">Profile</p>
            <h3 className="font-serif text-lg font-semibold text-gray-900 mt-0.5">Personal information</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="label-inst text-gray-600">Full Name</label>
              <div className="relative mt-1.5">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                         px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                         border border-cardinal-800 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Saving…' : 'Update profile'}
            </button>
          </form>
        </section>

        {/* ── Password ── */}
        <section className="surface-card p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-md bg-cardinal-50 text-cardinal-700 border border-cardinal-100">
              <HiOutlineShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="label-inst text-cardinal-700">Security</p>
              <h3 className="font-serif text-lg font-semibold text-gray-900 mt-0.5">Change password</h3>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label-inst text-gray-600">Current Password</label>
              <div className="relative mt-1.5">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-inst text-gray-600">New Password</label>
                <div className="relative mt-1.5">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="label-inst text-gray-600">Confirm</label>
                <div className="relative mt-1.5">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                         px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                         border border-cardinal-800 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Settings;
