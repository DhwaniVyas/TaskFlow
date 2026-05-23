import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckSquare } from 'react-icons/fi';
import api from '../api/client';
import { isAuthenticated } from '../utils/auth';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }
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
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service';
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
      const response = await api.post('/auth/register', { fullName: name, email, password });
      setSuccessMessage(response.data.message || 'Registration successful. Please verify your email.');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreeTerms(false);
      setErrors({});
    } catch (error) {
      setApiError(error?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F9FA] via-white to-[#FFE4D6]/20 flex flex-col justify-between py-12 px-6">
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
            <h2 className="page-title">Create Account</h2>
            <p className="text-xs text-[#5B9EA8] mt-1">Get started with a free TaskFlow workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && <p className="form-error-msg">{apiError}</p>}
            {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}
            {/* Name Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5B9EA8] pointer-events-none">
                  <FiUser />
                </span>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`form-input w-full !pl-10 ${errors.name ? 'form-input-error' : ''}`}
                />
              </div>
              {errors.name && <p className="form-error-msg">{errors.name}</p>}
            </div>

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
              <label className="form-label" htmlFor="password">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5B9EA8] pointer-events-none">
                  <FiLock />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
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

            {/* Confirm Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5B9EA8] pointer-events-none">
                  <FiLock />
                </span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`form-input w-full !pl-10 !pr-10 ${errors.confirmPassword ? 'form-input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5B9EA8] hover:text-[#0E7490] transition-colors"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && <p className="form-error-msg">{errors.confirmPassword}</p>}
            </div>

            {/* Agree Terms */}
            <div className="form-group pt-2">
              <div className="flex items-start">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 mt-0.5 text-[#0E7490] border-[#80CDD6] rounded focus:ring-[#22D3EE] focus:ring-opacity-25"
                />
                <label htmlFor="agree-terms" className="ml-2 block text-xs text-[#082F38] leading-tight font-medium cursor-pointer">
                  I agree to the{' '}
                  <a href="#" className="text-[#0E7490] hover:text-[#164E63] font-semibold">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#0E7490] hover:text-[#164E63] font-semibold">Privacy Policy</a>.
                </label>
              </div>
              {errors.agreeTerms && <p className="form-error-msg">{errors.agreeTerms}</p>}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-accent w-full py-3 mt-4 text-sm font-semibold tracking-wide"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Footer link */}
      <div className="max-w-md mx-auto w-full text-center mt-6 text-xs text-[#5B9EA8]">
        Already have an account?{' '}
        <Link to="/login" className="text-[#0E7490] hover:text-[#164E63] font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
}
