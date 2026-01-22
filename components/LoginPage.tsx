import React, { useState } from 'react';
import { signIn, signUp } from '../services/supabaseClient';

interface LoginPageProps {
  onLogin: (userId: string, email: string, fullName: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        onLogin(data.user.id, data.user.email || '', data.user.user_metadata?.full_name || '');
      } else {
        setError('Sign in failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during sign in');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await signUp(email, password, fullName);
      
      if (signUpError) {
        setError(signUpError);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setError('');
        setIsSignUp(false);
        setPassword('');
        setFullName('');
        // Auto-login after signup
        const { data: signInData, error: signInErr } = await signIn(email, password);
        if (signInData?.user) {
          onLogin(signInData.user.id, signInData.user.email || '', fullName);
        } else {
          setError('Account created! Please log in with your credentials.');
        }
      } else {
        setError('Sign up failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during sign up');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Direct demo login without calling Supabase
    onLogin('demo-user-123', 'demo@example.com', 'Demo User');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ7mm_A9Ivxsl-jHTcHJaAmRgNscfwRHwpXw&s" 
            alt="STP Analyser Logo"
            className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg shadow-emerald-500/20 object-cover"
          />
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            STP <span className="text-emerald-400">Analyser</span>
          </h1>
          <p className="text-sm text-slate-400 font-mono uppercase tracking-widest">Smart Traffic Analysis Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 bg-slate-800/30 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                !isSignUp 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                isSignUp 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Full Name Input (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-200 mb-2 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 font-mono">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900/50 text-slate-500 font-mono text-xs uppercase tracking-wider">OR</span>
              </div>
            </div>

            {/* Demo Login Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-200 font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue as Demo User
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center font-mono mb-3">
              Demo Credentials: demo / demo123
            </p>
            <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-emerald-400">STP Analyser</span> provides real-time traffic analysis and vehicle detection using advanced AI vision technology.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest">
          &copy; 2024 VISION-X LABS • SMART TRAFFIC PLATFORM
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
