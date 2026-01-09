import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, LogIn, UserPlus, User, ArrowRight, ArrowLeft } from 'lucide-react';
import ficLogo from '@/assets/fic-logo.jpeg';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const { user, login, signup, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  
  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginSubmitting(true);

    const result = await login(loginEmail, loginPassword);
    
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSignupSubmitting(true);

    const result = await signup(signupEmail, signupPassword, signupName);
    
    if (result.success) {
      toast.success('Account created successfully! You can now login.');
      setIsSignUp(false);
      setLoginEmail(signupEmail);
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
    } else {
      toast.error(result.error || 'Failed to create account');
    }
    
    setIsSignupSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-2xl overflow-hidden">
              <img src={ficLogo} alt="FIC Logo" className="h-20 w-20 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white">FIC BDA Portal</h1>
            <p className="text-amber-400 font-medium mt-1">Building Future</p>
          </div>

          <Card className="border-white/10 shadow-2xl bg-white/10 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl text-white">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-white/60">
                {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {!isSignUp ? (
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
                      <Label htmlFor="login-email" className="text-white/80">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-white/80">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          required
                        />
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

                    <div className="text-center pt-4">
                      <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className="text-sm text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 mx-auto"
                      >
                        Don't have an account? Sign up
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSignup}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-white/80">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-white/80">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-white/80">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password (min 6 chars)"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-white/80">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                        <Input
                          id="signup-confirm"
                          type="password"
                          placeholder="Confirm your password"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white gap-2 shadow-lg" 
                      disabled={isSignupSubmitting}
                    >
                      {isSignupSubmitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Create Account
                        </>
                      )}
                    </Button>

                    <div className="text-center pt-4">
                      <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="text-sm text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Already have an account? Sign in
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