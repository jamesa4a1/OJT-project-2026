import React, { useState, FormEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useValidation } from '../hooks/useValidation';
import { UserRegisterSchema } from '../schemas/users';
import logo from '../assets/logo.png';

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'Admin' | 'Staff' | 'Clerk';
}

interface RoleColor {
  bg: string;
  text: string;
  border: string;
  icon: string;
}

type RoleColors = {
  [key in 'Admin' | 'Staff' | 'Clerk']: RoleColor;
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const { validate, errors: validationErrors } = useValidation(UserRegisterSchema);

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Clerk',
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
    const validatedData = await validate({
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: formData.role,
    });

    if (!validatedData.success) {
      setIsLoading(false);
      return;
    }

    const validData = validatedData.data as {
      name: string;
      email: string;
      password: string;
      role: 'Admin' | 'Staff' | 'Clerk';
    };

    const userData = {
      name: validData.name,
      email: validData.email,
      password: validData.password,
      role: validData.role,
      registeredAt: new Date().toISOString(),
    };

    // Register user (now async - connects to database)
    const result = await register(userData);
    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      // Redirect after success animation
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      setError(result.message || 'Registration failed');
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
                        focus:bg-white focus:border-emerald-500 focus:ring-0
                        transition-all duration-200 outline-none text-slate-700 font-medium
                        placeholder:text-slate-400 hover:border-slate-300`;

  const roleColors: RoleColors = {
    Admin: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: 'fa-shield-halved',
    },
    Clerk: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: 'fa-pen-to-square',
    },
    Staff: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: 'fa-user',
    },
  };

  if (success) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 
                            flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
          >
            <i className="fas fa-check text-emerald-600 text-4xl"></i>
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful!</h2>
          <p className="text-slate-500 mb-4">Welcome to OCP Docketing System</p>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full 
                                    ${roleColors[formData.role].bg} ${roleColors[formData.role].border} border`}
          >
            <i
              className={`fas ${roleColors[formData.role].icon} ${roleColors[formData.role].text}`}
            ></i>
            <span className={`font-medium ${roleColors[formData.role].text}`}>
              Registered as {formData.role}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-4">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -ml-24 -mb-24"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 min-h-[650px] border border-slate-100"
      >
        {/* Left Side - Branding */}
        <div className="lg:w-2/5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

          <div className="relative z-10">
            <Link
              to="/homepage"
              className="inline-flex items-center gap-2 text-emerald-100/80 hover:text-white 
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
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
                Join the
                <br />
                System
              </h1>
              <p className="text-emerald-100 text-lg leading-relaxed font-light">
                Create your account to access the official OCP Docketing System of Tagbilaran City.
              </p>
            </motion.div>
          </div>

          <div className="relative z-10 hidden lg:block">
            <div className="flex items-center gap-3 text-sm text-emerald-200/60 mb-2">
              <div className="w-8 h-[1px] bg-emerald-200/30"></div>
              <span>Secure Platform</span>
            </div>
            <p className="text-xs text-emerald-200/40">© 2026 Office of the City Prosecutor</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:w-3/5 p-8 lg:p-14 bg-white h-auto lg:h-auto overflow-y-auto">
          <div className="max-w-xl mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create Account</h2>
              <p className="text-slate-500 mt-2 text-base">
                Please fill in your details to register.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {/* Roles - Full Width */}
                <motion.div variants={itemVariants} className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3.5">
                    Select Role
                  </label>
                  <div className="grid grid-cols-2 gap-3.5">
                    {Object.entries(roleColors).map(([role, colors]) => (
                      <motion.div
                        key={role}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 shadow-sm
                                                        ${
                                                          formData.role === role
                                                            ? `${colors.bg} ${colors.border} shadow-md`
                                                            : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow'
                                                        }`}
                        onClick={() =>
                          setFormData({ ...formData, role: role as 'Admin' | 'Staff' | 'Clerk' })
                        }
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.role === role ? 'bg-white shadow-sm' : 'bg-white'} transition-all`}
                        >
                          <i
                            className={`fas ${colors.icon} text-lg ${formData.role === role ? colors.text : 'text-slate-400'}`}
                          ></i>
                        </div>
                        <span
                          className={`text-sm font-bold ${formData.role === role ? colors.text : 'text-slate-600'}`}
                        >
                          {role}
                        </span>
                        {/* Checkmark for active */}
                        {formData.role === role && (
                          <div className="absolute top-3 right-3">
                            <div
                              className={`w-5 h-5 rounded-full ${colors.text.replace('text', 'bg')} flex items-center justify-center`}
                            >
                              <i className="fas fa-check text-white text-xs"></i>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Full Name */}
                <motion.div variants={itemVariants} className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Full Name
                  </label>
                  <div className="relative">
                    <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`${inputClass} pl-12 ${validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {validationErrors.name}
                    </p>
                  )}
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants} className="md:col-span-2">
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
                <motion.div variants={itemVariants}>
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
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  {validationErrors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {validationErrors.password}
                    </p>
                  )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`${inputClass} pl-12 ${validationErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Re-enter your password"
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                </motion.div>
              </div>

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
              <motion.div variants={itemVariants} className="pt-6\">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01, boxShadow: '0 20px 40px -5px rgba(5, 150, 105, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3.5 rounded-lg font-bold text-base text-white transition-all duration-200 border-none cursor-pointer
                                            flex items-center justify-center gap-2
                                            ${isLoading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'}`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin\"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <i className="fas fa-arrow-right text-sm\"></i>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-600 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
