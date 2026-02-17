import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        if (username.length < 3) {
          toast.error('Username must be at least 3 characters');
          setSubmitting(false);
          return;
        }
        await signUp(username, characterName, password);
        toast.success('Welcome to Riverside Ranch!');
      } else {
        await signIn(username, password);
        toast.success('Welcome back!');
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        toast.error('Invalid username or password');
      } else if (err.code === 'auth/email-already-in-use') {
        toast.error('That username is already taken');
      } else if (err.code === 'auth/weak-password') {
        toast.error('Password must be at least 6 characters');
      } else {
        toast.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-parchment-50 dark:bg-wood-950">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <img src="/Riverside_Ranch.png" alt="Riverside Ranch" className="w-28 h-28 mx-auto mb-4 object-contain drop-shadow-lg" />
          <h1 className="font-display text-3xl font-bold text-parchment-800 dark:text-white">
            Riverside Ranch
          </h1>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. theodorelockheart"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                required
                minLength={3}
              />
              <p className="text-xs text-parchment-400 mt-1">Letters and numbers only, no spaces</p>
            </div>

            {isSignUp && (
              <div>
                <label className="label">Character Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Theodore Lockheart"
                  value={characterName}
                  onChange={e => setCharacterName(e.target.value)}
                  required={isSignUp}
                />
                <p className="text-xs text-parchment-400 mt-1">Your in-game character name</p>
              </div>
            )}

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
              className="text-sm text-brand-500 dark:text-brand-400 hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
