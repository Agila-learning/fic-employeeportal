import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, LogIn, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import ficLogo from '@/assets/fic-logo.jpeg';
import { motion, AnimatePresence } from 'framer-motion';

type AuthView = 'login' | 'forgot';

const Auth = () => {
  const { user, login, resetPassword, isLoading } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // Check user FIRST — login sets user before isLoading clears
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginSubmitting(true);

    const timeout = setTimeout(() => {
      setIsLoginSubmitting(false);
      toast.error('Login is taking longer than expected. Please wait a few more seconds and check your connection.');
    }, 45000);

    const result = await login(loginEmail, loginPassword);
    clearTimeout(timeout);
    
    if (result.success) {
      toast.success('Welcome back!');
    } else {
      if (result.error?.includes('No permission')) {
        toast.error('No permission. Admin access required.');
      } else {
        toast.error(result.error || 'Invalid credentials');
      }
    }
    
    setIsLoginSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotSubmitting(true);

    const result = await resetPassword(forgotEmail);
    
    if (result.success) {
      toast.success('Password reset link sent to your email!');
      setView('login');
      setForgotEmail('');
    } else {
      toast.error(result.error || 'Failed to send reset link');
    }
    
    setIsForgotSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-600/25 to-indigo-600/20 blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo - Square with rounded corners to fit JPEG properly */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-24 w-24 rounded-xl shadow-2xl overflow-hidden border-2 border-amber-400/40 hover:border-amber-400/60 transition-all duration-500 hover:scale-105 bg-white">
              <img src={ficLogo} alt="FIC Logo" className="h-full w-full object-contain p-1" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">FIC Employee Portal</h1>
            <p className="text-amber-400 font-medium mt-1 tracking-wide">Building Future</p>
          </div>

          <Card className="border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-500">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl text-white">
                {view === 'login' ? 'Welcome Back' : 'Reset Password'}
              </CardTitle>
              <CardDescription className="text-white/60">
                {view === 'login' ? 'Sign in to continue' : 'Enter your email to reset'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {view === 'login' && (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-white/80">Email or Mobile Number</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                        <Input
                          id="login-email"
                          type="text"
                          placeholder="Enter email or mobile number"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="login-password" className="text-white/80">Password</Label>
                        <button
                          type="button"
                          onClick={() => setView('forgot')}
                          className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          required
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

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white gap-2 shadow-lg" 
                      disabled={isLoginSubmitting}
                    >
                      {isLoginSubmitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-white/40 pt-4">
                      Contact your administrator to request an account
                    </p>
                  </motion.form>
                )}

                {view === 'forgot' && (
                  <motion.form
                    key="forgot"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleForgotPassword}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-white/80">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="Enter your registered email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white gap-2 shadow-lg" 
                      disabled={isForgotSubmitting}
                    >
                      {isForgotSubmitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <KeyRound className="h-4 w-4" />
                          Send Reset Link
                        </>
                      )}
                    </Button>

                    <div className="text-center pt-4">
                      <button
                        type="button"
                        onClick={() => setView('login')}
                        className="text-sm text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sign in
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-white/40 mt-6">
            By continuing, you agree to FIC's Terms of Service
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-4">
        <div className="text-center text-sm text-white/40">
          <p>© 2026 Forge India Connect Pvt. Ltd. - Shaping Future</p>
          <p className="text-xs mt-1">All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default Auth;