import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import ficLogo from '@/assets/fic-logo.jpeg';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsChecking(false);
      }
    });

    // Also check if there's already a session (user clicked the link and was auto-logged in)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setIsChecking(false);
    };

    // Give onAuthStateChange a moment to fire first
    setTimeout(checkSession, 1000);

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully!');
        // Sign out and redirect to login
        await supabase.auth.signOut();
        navigate('/auth', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-4">
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Invalid or Expired Link</CardTitle>
            <CardDescription className="text-white/60">
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/auth')}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-600/25 to-indigo-600/20 blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-24 w-24 rounded-xl shadow-2xl overflow-hidden border-2 border-amber-400/40 bg-white">
              <img src={ficLogo} alt="FIC Logo" className="h-full w-full object-contain p-1" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Set New Password</h1>
          </div>

          <Card className="border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-400" />
                Reset Password
              </CardTitle>
              <CardDescription className="text-white/60">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-white/80">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white/80">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white gap-2 shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="relative border-t border-white/10 py-4">
        <div className="text-center text-sm text-white/40">
          <p>© 2026 Forge India Connect Pvt. Ltd. - Shaping Future</p>
        </div>
      </footer>
    </div>
  );
};

export default ResetPassword;
