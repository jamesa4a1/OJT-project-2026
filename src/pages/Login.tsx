import React, { useState, FormEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useValidation } from '../hooks/useValidation';
import { UserLoginSchema, type UserLogin } from '../schemas/users';
import logo from '../assets/logo.png';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { validate, errors: validationErrors } = useValidation(UserLoginSchema);

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate with Zod
    const validatedData = await validate(formData);
    if (!validatedData.success) {
      setIsLoading(false);
      return;
    }

    // Attempt login with credentials (now async)
    const { email, password } = validatedData.data as { email: string; password: string };
    const result = await login(email, password);

    setIsLoading(false);

    if (result.success) {
      // Login successful, navigate based on role returned from server
      if (result.role === 'Admin') {
        navigate('/admin-dashboard');
      } else if (result.role === 'Staff') {
        navigate('/staff-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      // Login failed, show error
      setError(result.message || 'Login failed');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const inputClass: string = `w-full px-5 py-3.5 rounded-lg border-2 border-slate-200 bg-slate-50
                        focus:bg-white focus:border-blue-500 focus:ring-0
                        transition-all duration-200 outline-none text-slate-700 font-medium
                        placeholder:text-slate-400 hover:border-slate-300`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/30 rounded-full blur-[100px] -ml-24 -mb-24"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 min-h-[550px] border border-slate-100"
      >
        {/* Left Side - Branding */}
        <div className="lg:w-2/5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-800 p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

          <div className="relative z-10">
            <Link
              to="/homepage"
              className="inline-flex items-center gap-2 text-slate-300/80 hover:text-white 
                                       transition-colors no-underline font-medium text-sm mb-8 group"
            >
              <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
              Back to Home
            </Link>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-6 shadow-inner ring-1 ring-white/20">
                <img src={logo} alt="DOJ Logo" className="w-14 h-14 drop-shadow-md" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">Welcome Back</h1>
              <p className="text-slate-300 text-lg leading-relaxed font-light">
                Sign in to access the OCP Docketing System and manage your cases efficiently.
              </p>
            </motion.div>
          </div>

          <div className="relative z-10 hidden lg:block">
            <div className="flex items-center gap-3 text-sm text-slate-400/60 mb-2">
              <div className="w-8 h-[1px] bg-slate-400/30"></div>
              <span>Secure Login</span>
            </div>
            <p className="text-xs text-slate-400/40">© 2026 Office of the City Prosecutor</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:w-3/5 p-8 lg:p-14 bg-white h-auto lg:h-auto overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Sign In</h2>
              <p className="text-slate-500 mt-2 text-base">
                Enter your credentials to access the system.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${inputClass} pl-12 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {validationErrors.email}
                  </p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Password
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${inputClass} pl-12 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="Enter your password"
                  />
                </div>
                {validationErrors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {validationErrors.password}
                  </p>
                )}
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3 font-medium"
                >
                  <i className="fas fa-exclamation-circle text-red-500 text-base"></i>
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-6"
              >
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01, boxShadow: '0 20px 40px -5px rgba(37, 99, 235, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3.5 rounded-lg font-bold text-base text-white transition-all duration-200 border-none cursor-pointer
                                            flex items-center justify-center gap-2
                                            ${isLoading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30'}`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <i className="fas fa-arrow-right text-sm"></i>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-600 text-sm">Need an account? Contact your administrator.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
