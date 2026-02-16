import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        toast.success('Account created! You may need to verify your email.');
      } else {
        await signIn(email, password);
        toast.success('Welcome back!');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-parchment-50 dark:bg-wood-950">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-wood-800 flex items-center justify-center mx-auto mb-4">
            <span className="font-display text-3xl font-bold text-parchment-200">R</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-wood-800 dark:text-parchment-100">
            Riverside Ranch
          </h1>
          <p className="text-sm text-wood-500 dark:text-wood-400 mt-1">Management System</p>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="label">Display Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your ranch name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-wood-600 dark:text-wood-400 hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
