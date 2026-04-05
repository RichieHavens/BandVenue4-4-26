import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Music, Mail, Lock, Loader2, UserPlus, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import AboutModal from './AboutModal';

export default function AuthUI({ onSuccess }: { onSuccess?: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    fetchHeroImage();
  }, []);

  async function fetchHeroImage() {
    try {
      const { data, error } = await supabase
        .from('stock_images')
        .select('url')
        .eq('type', 'hero')
        .eq('category', 'home')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (data && data.url) {
        setHeroImage(data.url);
      }
    } catch (err) {
      console.warn("Could not fetch custom hero image, using default.");
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Auth attempt started");
    setLoading(true);
    setError(null);
    setSuccess(null);

    const emailToAuth = email.trim().toLowerCase();
    
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(emailToAuth, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess('Password reset link sent! Please check your email.');
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email: emailToAuth, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) {
          if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists')) {
            setError('This email already has an account. Click forgot password and check your email to reset it.');
          } else {
            throw error;
          }
        } else {
          setSuccess('Check your email for the confirmation link!');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: emailToAuth, password });
        if (error) {
          console.error("Login Error Details:", error);
          console.error("Login Error Message:", error.message);
          console.error("Login Error Status:", error.status);
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email address before logging in. Check your inbox for the confirmation link.');
          }
          throw error;
        }
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', emailToAuth);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setResending(true);
    setError(null);
    setSuccess(null);
    const emailToResend = email.trim().toLowerCase();
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToResend,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      setSuccess('Confirmation email resent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-4 relative overflow-hidden"
      style={heroImage ? {
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
    >
      {heroImage && (
        <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm z-0" />
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 shadow-2xl text-white relative z-10"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-neutral-400 text-sm mt-2">
            {isForgotPassword 
              ? 'Enter your email to receive a reset link' 
              : isSignUp 
                ? 'Join the local music community' 
                : 'Sign in to manage your venues and events'}
          </p>
        </div>
        {!isForgotPassword && (
          <div className="flex bg-neutral-950/50 p-1.5 rounded-2xl mb-8 border border-neutral-800/50">
            <button
              onClick={() => { setIsSignUp(false); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${!isSignUp ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isSignUp ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-neutral-300">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(null); setSuccess(null); }}
                    className="text-xs text-red-600 hover:text-red-500 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {!isForgotPassword && !isSignUp && (
            <div className="flex items-center gap-2 ml-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-red-600 border-red-600' : 'bg-neutral-800 border-neutral-700'}`}
              >
                {rememberMe && <CheckCircle2 size={14} className="text-white" />}
              </button>
              <span className="text-xs text-neutral-400 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                Remember Me
              </span>
            </div>
          )}

          {error && (
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                {error}
              </div>
              {error.toLowerCase().includes('confirm') && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="w-full text-red-600 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  {resending ? <Loader2 className="animate-spin" size={14} /> : 'Resend Confirmation Email'}
                </button>
              )}
              {error.toLowerCase().includes('forgot password') && (
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(null); setSuccess(null); }}
                  className="w-full text-red-600 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  Go to Forgot Password
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="space-y-4">
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl text-center">
                {success}
              </div>
              {isSignUp && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="w-full text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  {resending ? <Loader2 className="animate-spin" size={14} /> : "Didn't get the email? Resend"}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isForgotPassword ? 'Send Reset Link' : isSignUp ? <UserPlus size={20} /> : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 text-center space-y-6">
          {isForgotPassword ? (
            <button
              onClick={() => { setIsForgotPassword(false); setError(null); setSuccess(null); }}
              className="text-neutral-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              Back to Sign In
            </button>
          ) : (
            <>
              <div className="pt-6 border-t border-neutral-800/50">
                {isSignUp ? (
                  <p className="text-neutral-400 text-sm">
                    Already have an account?{' '}
                    <button
                      onClick={() => { setIsSignUp(false); setError(null); setSuccess(null); }}
                      className="text-red-600 hover:text-red-500 font-bold transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p className="text-neutral-400 text-sm">
                    New to BandVenue?{' '}
                    <button
                      onClick={() => { setIsSignUp(true); setError(null); setSuccess(null); }}
                      className="text-red-600 hover:text-red-500 font-bold transition-colors"
                    >
                      Create an Account
                    </button>
                  </p>
                )}
              </div>

              {!isSignUp && (
                <button
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors block w-full"
                >
                  Didn't get a confirmation email? Resend
                </button>
              )}
              <p className="text-neutral-500 text-[10px] uppercase tracking-widest leading-relaxed">
                {isSignUp 
                  ? 'By signing up, you agree to our Terms of Service and Privacy Policy.' 
                  : 'Forgot your password? Click above to reset it.'}
              </p>
            </>
          )}
        </div>
      </motion.div>

      <div className="mt-12 w-full max-w-md relative z-10">
        <button 
          onClick={() => setIsAboutOpen(true)}
          className="w-full py-4 px-6 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 hover:border-red-600/50 rounded-2xl text-neutral-400 hover:text-red-600 transition-all group flex items-center justify-between shadow-xl"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Learn About BandVenue</span>
          <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-all">
            <Music size={14} />
          </div>
        </button>
      </div>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
