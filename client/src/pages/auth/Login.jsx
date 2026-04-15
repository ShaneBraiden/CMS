import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success('Welcome back');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Brand Hero (left, desktop) ────────────────── */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden
                         bg-gradient-to-br from-cardinal-800 via-cardinal-700 to-cardinal-950 pattern-hatch text-white">
        {/* Decorative frame */}
        <div className="absolute inset-6 border border-gold-500/30 rounded-lg pointer-events-none" />
        <div className="absolute top-10 left-10 right-10 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top */}
          <div>
            <p className="label-inst text-gold-200/90">Deemed University · Porur, Chennai</p>
            <div className="divider-gold mt-3 max-w-[100px]" />
          </div>

          {/* Centre seal + title */}
          <div className="flex flex-col items-center text-center -mt-6">
            <img
              src="/sret.png"
              alt="Sri Ramachandra Faculty of Engineering and Technology"
              className="w-[420px] xl:w-[500px] drop-shadow-xl"
            />
            <div className="divider-gold mt-6 w-32" />
            <p className="mt-5 max-w-md text-[13px] leading-relaxed text-white/80">
              A unified campus platform for students, faculty and administration —
              attendance, assignments, examinations and academic records, in one place.
            </p>
          </div>

          {/* Bottom */}
          <div className="flex items-end justify-between text-[10px] uppercase tracking-[0.22em] text-gold-200/70">
            <span>Campus Management System</span>
            <span>Est. 2019</span>
          </div>
        </div>
      </aside>

      {/* ── Form (right) ─────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex flex-col items-center mb-8 text-center">
            <img src="/logo_sret.png" alt="SRET" className="w-24" />
            <h1 className="font-serif text-2xl font-semibold text-cardinal-700 mt-3">SRI RAMACHANDRA</h1>
            <p className="font-serif italic text-gold-700">Engineering and Technology</p>
            <div className="divider-gold mt-3 w-24" />
          </div>

          <div className="surface-card p-8 sm:p-10">
            <div className="mb-7">
              <p className="label-inst text-cardinal-700">Sign In</p>
              <h2 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Welcome back</h2>
              <p className="text-sm text-gray-500 mt-2">
                Access your Campus Management System account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-inst text-gray-600">Institution Email</label>
                <div className="relative mt-1.5">
                  <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@sriher.edu.in"
                    required autoFocus autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none
                               transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="label-inst text-gray-600">Password</label>
                <div className="relative mt-1.5">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required autoComplete="current-password"
                    className="w-full pl-10 pr-16 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none
                               transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-cardinal-700 uppercase tracking-wider"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900
                           text-white py-3 rounded-md font-sans font-semibold tracking-wide
                           uppercase text-sm shadow-sm border border-cardinal-800
                           disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
              New to the portal?{' '}
              <Link to="/register" className="text-cardinal-700 hover:text-cardinal-900 font-semibold">
                Create an account
              </Link>
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

export default Login;
