import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const quickLinks = [
    { path: '/homepage', label: 'Home' },
    { path: '/cases', label: 'Cases' },
    { path: '/aboutus', label: 'About' },
  ];

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                 text-white mt-auto overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 
                              flex items-center justify-center shadow-lg shadow-blue-500/30">
                <i className="fas fa-balance-scale text-white text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg text-white m-0">OCP Docketing System</h3>
                <p className="text-blue-400 text-sm m-0">Digital Case Management</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Streamlining legal case management for the Office of the City Prosecutor, 
              Tagbilaran City Hall of Justice.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h4 className="font-semibold text-white mb-4 flex items-center justify-center gap-2">
              <i className="fas fa-link text-blue-400"></i>
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-slate-400 hover:text-blue-400 transition-colors duration-300 
                               inline-flex items-center gap-2 no-underline"
                  >
                    <i className="fas fa-chevron-right text-xs"></i>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-right">
            <h4 className="font-semibold text-white mb-4 flex items-center justify-center md:justify-end gap-2">
              <i className="fas fa-map-marker-alt text-blue-400"></i>
              Contact
            </h4>
            <address className="text-slate-400 text-sm not-italic space-y-2">
              <p className="flex items-center justify-center md:justify-end gap-2 m-0">
                <i className="fas fa-building text-blue-400/70"></i>
                Hall of Justice
              </p>
              <p className="flex items-center justify-center md:justify-end gap-2 m-0">
                <i className="fas fa-location-dot text-blue-400/70"></i>
                Carlos P. Garcia E Ave
              </p>
              <p className="flex items-center justify-center md:justify-end gap-2 m-0">
                <i className="fas fa-city text-blue-400/70"></i>
                Tagbilaran City, 6300 Bohol
              </p>
            </address>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Copyright */}
            <p className="text-slate-400 text-sm text-center md:text-left m-0">
              © {currentYear} Office of the City Prosecutor - Tagbilaran City
              <span className="hidden sm:inline"> • </span>
              <br className="sm:hidden" />
              <span className="text-slate-500">All Rights Reserved</span>
            </p>

            {/* Developer Credit */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Developed with</span>
              
              <span className="text-slate-400">
                by <span className="text-blue-400 font-medium">James.Jeff.Josh</span>
              </span>
            </div>

            {/* DOJ Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full 
                            bg-slate-800/50 border border-slate-700/50">
              <i className="fas fa-shield-halved text-blue-400"></i>
              <span className="text-slate-400 text-xs font-medium">
                Department of Justice • PH
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
