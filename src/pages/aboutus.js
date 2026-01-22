import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const About = () => {
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    {
      id: 'doj',
      title: 'Department of Justice',
      icon: 'fa-landmark',
      content: `The Department of Justice (DOJ) of the Philippines serves as the government's 
                     main legal authority. It provides legal advice and representation to the 
                     Republic of the Philippines, its branches, agencies, and instrumentalities.`,
      highlights: [
        { icon: 'fa-gavel', text: 'Legal Authority' },
        { icon: 'fa-scale-balanced', text: 'Justice Administration' },
        { icon: 'fa-shield-halved', text: 'Rights Protection' },
      ],
    },
    {
      id: 'hoj',
      title: 'Hall of Justice',
      subtitle: 'Tagbilaran City',
      icon: 'fa-building-columns',
      content: `The Hall of Justice in Tagbilaran City houses the Office of the City Prosecutor, 
                     providing essential legal services to the people of Bohol. Our office is 
                     committed to the fair and efficient administration of justice.`,
      address: {
        street: 'New Capitol Site,  Lino Chatto Drive',
        city: 'Tagbilaran City',
        postal: 'City Prosecution Office',
        country: 'Philippines',
      },
    },
    {
      id: 'ocp',
      title: 'Office of the City Prosecutor',
      icon: 'fa-user-tie',
      content: `The Office of the City Prosecutor is responsible for the investigation and 
                     prosecution of criminal cases within its jurisdiction. We are dedicated to 
                     upholding the rule of law and ensuring justice for all.`,
      services: [
        'Case Investigation',
        'Criminal Prosecution',
        'Legal Documentation',
        'Public Assistance',
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 
                        py-12 px-4 relative overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                                    bg-blue-100 border border-blue-200 mb-4"
          >
            <i className="fas fa-info-circle text-blue-600"></i>
            <span className="text-blue-700 font-medium text-sm">About Us</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Learn More About Our Office
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Serving the people of Tagbilaran City and the Province of Bohol with integrity and
            dedication to justice
          </p>
        </motion.div>

        {/* Section Navigation */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-2xl p-2 shadow-lg border border-slate-200">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium 
                                           text-sm transition-all duration-300 border-none cursor-pointer
                                           ${
                                             activeSection === index
                                               ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                               : 'text-slate-600 hover:bg-slate-100'
                                           }`}
              >
                <i className={`fas ${section.icon}`}></i>
                <span className="hidden sm:inline">{section.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-8 md:p-12">
              {/* Section Header */}
              <div className="flex items-start gap-6 mb-8">
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl 
                                                bg-gradient-to-br from-blue-500 to-blue-600 
                                                flex items-center justify-center flex-shrink-0
                                                shadow-lg shadow-blue-500/30"
                >
                  <i
                    className={`fas ${sections[activeSection].icon} text-white text-2xl md:text-3xl`}
                  ></i>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">
                    {sections[activeSection].title}
                  </h2>
                  {sections[activeSection].subtitle && (
                    <p className="text-blue-600 font-medium">{sections[activeSection].subtitle}</p>
                  )}
                </div>
              </div>

              {/* Content */}
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                {sections[activeSection].content}
              </p>

              {/* Highlights for DOJ section */}
              {sections[activeSection].highlights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sections[activeSection].highlights.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 p-4 rounded-xl 
                                                       bg-slate-50 border border-slate-200"
                    >
                      <div
                        className="w-10 h-10 rounded-lg bg-blue-100 
                                                            flex items-center justify-center"
                      >
                        <i className={`fas ${item.icon} text-blue-600`}></i>
                      </div>
                      <span className="font-medium text-slate-700">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Address for HOJ section */}
              {sections[activeSection].address && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-slate-50 to-blue-50 
                                               rounded-2xl p-6 border border-slate-200"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl bg-blue-600 
                                                        flex items-center justify-center flex-shrink-0"
                    >
                      <i className="fas fa-map-marker-alt text-white text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">Office Address</h3>
                      <address className="not-italic text-slate-600 space-y-1">
                        <p className="m-0">{sections[activeSection].address.street}</p>
                        <p className="m-0">{sections[activeSection].address.city}</p>
                        <p className="m-0">{sections[activeSection].address.postal}</p>
                        <p className="font-medium text-blue-600 m-0">
                          {sections[activeSection].address.country}
                        </p>
                      </address>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Services for OCP section */}
              {sections[activeSection].services && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sections[activeSection].services.map((service, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-center p-4 rounded-xl bg-slate-50 
                                                       border border-slate-200 hover:border-blue-300 
                                                       hover:bg-blue-50 transition-all duration-300"
                    >
                      <i className="fas fa-check-circle text-blue-500 text-xl mb-2"></i>
                      <p className="text-sm font-medium text-slate-700 m-0">{service}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Section Footer */}
            <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <i className="fas fa-clock"></i>
                  <span>Office Hours: Monday - Friday, 8:00 AM - 5:00 PM</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Badge */}
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl 
                                    bg-white shadow-lg border border-slate-200"
          >
            <i className="fas fa-shield-halved text-blue-600 text-xl"></i>
            <div className="text-left">
              <p className="text-xs text-slate-500 m-0">Republic of the Philippines</p>
              <p className="font-semibold text-slate-700 m-0">Department of Justice</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default About;
