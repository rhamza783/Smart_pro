import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePrompt } from '../hooks/usePrompt';

const LoginPage: React.FC = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const { askConfirm } = usePrompt();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    
    if (login(loginId, password)) {
      navigate('/pos');
    } else {
      setError('Invalid Login ID or Password');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background rounded-3xl shadow-neumorphic p-10 flex flex-col items-center">
        {/* Logo Placeholder */}
        <div className="w-24 h-24 rounded-full shadow-neumorphic flex items-center justify-center mb-6 bg-background">
          <span className="text-2xl font-black text-primary">AMS</span>
        </div>

        <h1 className="text-2xl font-bold text-primary mb-2 text-center">
          AL-MADINA SHINWARI POS
        </h1>
        <p className="text-text-secondary text-sm mb-8 text-center">
          Enter your credentials to access the system
        </p>

        <form className="w-full space-y-6" onSubmit={handleLogin}>
          {/* Login ID Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={18} className="text-text-secondary" />
            </div>
            <input
              type="text"
              placeholder="Login ID"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full bg-background shadow-neumorphic-inset rounded-xl pl-12 pr-4 py-4 outline-none text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-text-secondary" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-background shadow-neumorphic-inset rounded-xl pl-12 pr-12 py-4 outline-none text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-secondary hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-danger text-sm font-medium text-center animate-pulse">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-neumorphic hover:opacity-90 active:shadow-neumorphic-inset transition-all transform active:scale-95"
          >
            Login
          </button>

          <div className="pt-4 flex flex-col items-center">
            <button
              type="button"
              onClick={async () => {
                const confirmed = await askConfirm(
                  'Reset Application Data',
                  'This will clear all local data and reset the app. Are you sure?'
                );
                if (confirmed) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="text-[10px] text-text-secondary/50 hover:text-danger transition-colors uppercase tracking-widest font-bold"
            >
              Reset Application Data
            </button>
            <p className="text-[9px] text-text-secondary/30 mt-2">
              Default: admin / admin
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
