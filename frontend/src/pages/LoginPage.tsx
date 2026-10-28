import React, { useState } from 'react';
import { Flame, ShieldCheck, KeyRound, ArrowRight, RefreshCw, CheckCircle2, Lock, Sun, Moon } from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface LoginPageProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [email, setEmail] = useState('admin@dryertwin.com');
  const [password, setPassword] = useState('admin123');
  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.login(email, password);
      setStep('2fa');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.verify2FA(email, otp);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-200 ${
      theme === 'light'
        ? 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 text-slate-900'
        : 'bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 text-white'
    }`}>
      {/* Theme Toggle Button (Top-Right) */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl border backdrop-blur-md shadow-md text-xs font-bold flex items-center gap-2 transition-all ${
            theme === 'light'
              ? 'bg-white/80 border-slate-300 text-slate-700 hover:bg-white'
              : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Background Decorative Rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-500 blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        {/* Brand Header Banner */}
        <div className="bg-navy-900 p-8 text-center border-b border-slate-800 text-white relative">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/30 mb-4">
            <Flame className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            DRYER TWIN
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Food Dehydration Monitoring System
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Digital Twin Biotechnology Prototype</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{error}</span>
            </div>
          )}

          {step === 'login' ? (
            /* STEP 1: Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dryertwin.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">Demo: admin123</span>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Two-Factor Authentication */
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-800">
                  Two-Factor Authentication
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter 6-digit verification code sent to <strong className="text-slate-700">{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Access Dashboard</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ← Back to Login
                </button>
                <button
                  type="button"
                  onClick={() => setOtp('123456')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {/* Prototype Notice Callout */}
          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-8 -mb-8 p-4 text-center rounded-b-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Prototype Authentication</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Default credentials prefilled for testing. OTP: <strong>123456</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
