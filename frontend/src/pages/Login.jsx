import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckSquare } from 'react-icons/fi';
import api from '../api/client';
import { isAuthenticated, setToken } from '../utils/auth';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setApiError('');
      setIsLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data.data;
      setToken(token);
      navigate('/dashboard');
    } catch (error) {
      setApiError(error?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#F0F9FA] via-white to-[#FFE4D6]/20 flex flex-col justify-between py-12 px-6">
      {/* Back navigation */}
      <div className="max-w-md mx-auto w-full mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5B9EA8] hover:text-[#0E7490] transition-colors">
          <FiArrowLeft className="text-sm" /> Back to Home
        </Link>
      </div>

      {/* Main card */}
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card bg-white p-8 md:p-10 border-[#C4E9ED]/50"
        >
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0E7490] to-[#22D3EE] shadow-md mb-3 text-white text-2xl">
              <FiCheckSquare />
            </div>
            <h2 className="page-title">Welcome back</h2>
            <p className="text-xs text-[#5B9EA8] mt-1">Sign in to manage your workspace and tasks.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {apiError && <p className="form-error-msg">{apiError}</p>}
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5B9EA8] pointer-events-none">
                  <FiMail />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`form-input w-full !pl-10 ${errors.email ? 'form-input-error' : ''}`}
                />
              </div>
              {errors.email && <p className="form-error-msg">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="flex justify-between items-center">
                <label className="form-label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#0E7490] hover:text-[#164E63] font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5B9EA8] pointer-events-none">
                  <FiLock />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`form-input w-full !pl-10 !pr-10 ${errors.password ? 'form-input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5B9EA8] hover:text-[#0E7490] transition-colors"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="form-error-msg">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#0E7490] border-[#80CDD6] rounded focus:ring-[#22D3EE] focus:ring-opacity-25"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-[#082F38] font-medium cursor-pointer">
                Keep me signed in
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 mt-4 text-sm font-semibold tracking-wide"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Social Logins */}
          <div className="mt-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#C4E9ED]/50"></div>
              </div>
              <div className="relative text-xs text-[#5B9EA8] bg-white px-4 inline-block uppercase tracking-wider font-semibold">
                Or continue with
              </div>
            </div>

            <GoogleAuthButton
              setLoading={setIsLoading}
              onSuccess={() => navigate('/dashboard')}
              onError={(message) => setApiError(message)}
            />
          </div>
        </motion.div>
      </div>

      {/* Footer link */}
      <div className="max-w-md mx-auto w-full text-center mt-6 text-xs text-[#5B9EA8]">
        Don't have an account?{' '}
        <Link to="/register" className="text-[#0E7490] hover:text-[#164E63] font-semibold transition-colors">
          Sign up for free
        </Link>
      </div>
    </div>
  );
}
