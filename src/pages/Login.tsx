import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { authService } from '../services/api';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo credentials
    const demoUser = { email: 'admin@haneus.cafe', password: 'password123', name: 'Demo Admin' };
    
    try {
      // In a real app with Django, this would be:
      // const response = await authService.login({ email, password });
      // localStorage.setItem('token', response.data.token);
      
      // For the preview, we'll keep the local logic but show the service usage
      const stored = JSON.parse(localStorage.getItem('haneus_user') || '{}');
      
      if (
        (email === demoUser.email && password === demoUser.password) ||
        (stored.email === email && stored.password === password)
      ) {
        localStorage.setItem('haneus_logged_in', 'true');
        if (email === demoUser.email) {
          localStorage.setItem('haneus_user', JSON.stringify(demoUser));
        }
        navigate('/');
      } else {
        alert('Invalid credentials. Use admin@haneus.cafe / password123 for demo.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login.');
    }
  };

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Left: Auth Side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          <h1 className="text-3xl font-bold text-espresso mb-10 text-center tracking-tight">USER LOGIN</h1>
          
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-espresso/80">
            <p className="font-bold mb-1">Demo Access:</p>
            <p>Email: <span className="font-mono select-all">admin@haneus.cafe</span></p>
            <p>Pass: <span className="font-mono select-all">password123</span></p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Username or Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-xl text-espresso shadow-md focus:outline-none focus:ring-3 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-4 bg-white border-none rounded-xl text-espresso shadow-md focus:outline-none focus:ring-3 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-espresso/60 hover:text-espresso"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 text-espresso cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-primary rounded" />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-primary font-medium hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="w-3/5 mx-auto block py-4 bg-primary text-white rounded-xl font-semibold shadow-lg hover:bg-primary-dark hover:-translate-y-0.5 transition-all active:translate-y-0"
            >
              Login
            </button>
          </form>

          <div className="flex items-center gap-4 my-8 text-mocha/40 text-sm">
            <div className="flex-1 h-px bg-latte" />
            <span>OR</span>
            <div className="flex-1 h-px bg-latte" />
          </div>

          <p className="text-center text-mocha text-sm">
            Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Sign up here.</Link>
          </p>
        </motion.div>
      </div>

      {/* Right: Visual Side */}
      <div className="hidden lg:block flex-1 bg-gradient-to-r from-espresso to-[#1f1717] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(196,123,66,0.08)_0%,transparent_60%)] opacity-70" />
      </div>
    </div>
  );
}
