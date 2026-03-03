import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password should be at least 6 characters long.');
      return;
    }

    // In a real app, this would call /api/auth/register
    const user = { 
      name: formData.name, 
      email: formData.email, 
      password: formData.password 
    };
    
    localStorage.setItem('haneus_user', JSON.stringify(user));
    localStorage.setItem('haneus_logged_in', 'true');
    navigate('/');
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
          <h1 className="text-3xl font-bold text-espresso mb-10 text-center tracking-tight">CREATE ACCOUNT</h1>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-xl text-espresso shadow-md focus:outline-none focus:ring-3 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-xl text-espresso shadow-md focus:outline-none focus:ring-3 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="w-full pl-12 pr-12 py-4 bg-white border-none rounded-xl text-espresso shadow-md focus:outline-none focus:ring-3 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-espresso/60 hover:text-espresso"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-3/5 mx-auto block py-4 bg-primary text-white rounded-xl font-semibold shadow-lg hover:bg-primary-dark hover:-translate-y-0.5 transition-all active:translate-y-0 mt-6"
            >
              Sign Up
            </button>
          </form>

          <div className="flex items-center gap-4 my-8 text-mocha/40 text-sm">
            <div className="flex-1 h-px bg-latte" />
            <span>OR</span>
            <div className="flex-1 h-px bg-latte" />
          </div>

          <p className="text-center text-mocha text-sm">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Login here.</Link>
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
