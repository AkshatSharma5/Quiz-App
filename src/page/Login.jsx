import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster, toast } from 'react-hot-toast';
import { FaGoogle, FaEnvelope, FaLock } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await login(email, password);
      toast.success('Welcome back! 🎉');
      navigate('/');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success('Welcome back! 🚀');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[92vh] flex items-center justify-center p-4">
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)' } }} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel rounded-3xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-main)] mb-2 title-glow">
              WELCOME BACK.
            </h1>
            <p className="text-[var(--text-muted)] font-medium">Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 bg-[var(--bg-base)] border-[var(--border-color)] rounded-xl font-medium focus-visible:ring-[#00A63E] dark:focus-visible:ring-[#39FF14]"
                required
              />
            </div>

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 bg-[var(--bg-base)] border-[var(--border-color)] rounded-xl font-medium focus-visible:ring-[#00A63E] dark:focus-visible:ring-[#39FF14]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-base mt-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-[var(--border-color)]" />
            <span className="px-4 text-[var(--text-muted)] text-sm font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[var(--border-color)]" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn-secondary w-full h-12 flex items-center justify-center gap-3 text-base"
          >
            <FaGoogle />
            Continue with Google
          </button>

          <p className="text-center mt-8 text-[var(--text-muted)] font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#00A63E] dark:text-[#39FF14] hover:underline font-bold">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
