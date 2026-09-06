import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, LogIn, UserPlus, CheckCircle, Mail, Loader2 } from 'lucide-react';

export default function Login() {
  const { users, login, signup, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [selectedEmail, setSelectedEmail] = useState(users[0]?.email || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [title, setTitle] = useState('Product Engineer');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const emailToUse = selectedEmail.trim();
    if (!emailToUse) {
      setError('Please enter or select an email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(emailToUse);
      if (res && res.success) {
        navigate('/dashboard');
      } else {
        setError(res?.error || 'Failed to sign in. Please verify the email address.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        title
      });

      if (res && res.success) {
        navigate('/dashboard');
      } else {
        setError(res?.error || 'Failed to create account');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating your account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle background glow accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl p-8 z-10 text-card-foreground animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-3 shadow-md shadow-primary/20">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Workspace OS</h1>
          <p className="text-muted-foreground mt-1 text-xs text-center">
            Modern Notion & Jira hybrid for high-velocity teams.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-muted/60 p-1 rounded-xl mb-6 border border-border/60">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'login' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'signup' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create New Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-medium text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Direct Email Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="email"
                  value={selectedEmail}
                  onChange={e => setSelectedEmail(e.target.value)}
                  placeholder="Enter email (e.g. hamza@workspace.pk)"
                  required
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs font-medium"
                />
              </div>
            </div>

            {/* Quick Profile Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Or Quick-Select Team Profile
              </label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {users.map((u) => {
                  const isSelected = selectedEmail.toLowerCase() === u.email.toLowerCase();
                  return (
                    <div
                      key={u.id || u.email}
                      onClick={() => setSelectedEmail(u.email)}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs'
                          : 'border-border/60 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                        />
                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground truncate">{u.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-muted text-muted-foreground shrink-0">
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>

                      {isSelected && <CheckCircle size={15} className="text-primary mr-1 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingAuth}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-bold ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full shadow-md shadow-primary/20 mt-2 disabled:opacity-60"
            >
              {isSubmitting || isLoadingAuth ? (
                <>
                  <Loader2 size={15} className="mr-2 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn size={15} className="mr-2" />
                  <span>Sign In to Workspace</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Talha Akbar"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. talha@workspace.pk"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background font-medium"
                >
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                  <option value="Viewer">Viewer (Read-Only)</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Fullstack Engineer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingAuth}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-bold ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full shadow-md shadow-primary/20 mt-2 disabled:opacity-60"
            >
              {isSubmitting || isLoadingAuth ? (
                <>
                  <Loader2 size={15} className="mr-2 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} className="mr-2" />
                  <span>Create Account & Launch</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
