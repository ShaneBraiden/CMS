import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 8)                return toast.error('Password must be at least 8 characters');
    if (!form.email.toLowerCase().endsWith('@sriher.edu.in'))
      return toast.error('Only @sriher.edu.in emails are allowed');

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      toast.success(form.role === 'teacher'
        ? 'Request submitted — awaiting admin approval'
        : 'Account created');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Brand Hero ──────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden
                         bg-gradient-to-br from-cardinal-800 via-cardinal-700 to-cardinal-950 pattern-hatch text-white">
        <div className="absolute inset-6 border border-gold-500/30 rounded-lg pointer-events-none" />
        <div className="absolute top-10 left-10 right-10 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div>
            <p className="label-inst text-gold-200/90">Deemed University · Porur, Chennai</p>
            <div className="divider-gold mt-3 max-w-[100px]" />
          </div>

          <div className="flex flex-col items-center text-center -mt-6">
            <img src="/sret.png" alt="Sri Ramachandra Faculty of Engineering and Technology" className="w-[420px] xl:w-[500px] drop-shadow-xl" />
            <div className="divider-gold mt-6 w-32" />
            <p className="mt-5 max-w-md text-[13px] leading-relaxed text-white/80">
              Join the institutional portal to access courses, attendance, assignments
              and examinations. Faculty registrations are verified by administration.
            </p>
          </div>

          <div className="flex items-end justify-between text-[10px] uppercase tracking-[0.22em] text-gold-200/70">
            <span>Campus Management System</span>
            <span>Registration</span>
          </div>
        </div>
      </aside>

      {/* ── Form ────────────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8 text-center">
            <img src="/logo_sret.png" alt="SRET" className="w-24" />
            <h1 className="font-serif text-2xl font-semibold text-cardinal-700 mt-3">SRI RAMACHANDRA</h1>
            <p className="font-serif italic text-gold-700">Engineering and Technology</p>
            <div className="divider-gold mt-3 w-24" />
          </div>

          <div className="surface-card p-8 sm:p-10">
            <div className="mb-6">
              <p className="label-inst text-cardinal-700">Create Account</p>
              <h2 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Register</h2>
              <p className="text-sm text-gray-500 mt-2">For students and faculty with an SRIHER email.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-inst text-gray-600">Full Name</label>
                <div className="relative mt-1.5">
                  <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange} required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="label-inst text-gray-600">Institution Email</label>
                <div className="relative mt-1.5">
                  <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange} required
                    placeholder="name@sriher.edu.in" autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="label-inst text-gray-600">Role</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {[
                    { v: 'student', label: 'Student' },
                    { v: 'teacher', label: 'Faculty' },
                  ].map(opt => (
                    <button
                      type="button" key={opt.v}
                      onClick={() => setForm(f => ({ ...f, role: opt.v }))}
                      className={`px-4 py-2.5 text-sm font-medium rounded-md border transition-all ${
                        form.role === opt.v
                          ? 'bg-cardinal-700 text-white border-cardinal-800 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-cardinal-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {form.role === 'teacher' && (
                  <p className="mt-2 text-[11px] text-gold-700 flex items-center gap-1">
                    <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                    Faculty accounts require administrator approval.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-inst text-gray-600">Password</label>
                  <div className="relative mt-1.5">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password" name="password" value={form.password} onChange={handleChange} required minLength={8}
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
                      type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required minLength={8}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                                 focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full mt-3 bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900
                           text-white py-3 rounded-md font-sans font-semibold tracking-wide
                           uppercase text-sm shadow-sm border border-cardinal-800
                           disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
              Already have an account?{' '}
              <Link to="/login" className="text-cardinal-700 hover:text-cardinal-900 font-semibold">Sign in</Link>
            </p>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-6 tracking-wide">
            © {new Date().getFullYear()} Sri Ramachandra Engineering and Technology
          </p>
        </div>
      </section>
    </div>
  );
};

export default Register;
