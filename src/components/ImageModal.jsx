import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageModal = ({ isOpen, onClose, imageUrl, imageName = 'Image' }) => {

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: '40px',
          }}
        >
          {/* Close Button (X) - Top Right */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.1, backgroundColor: '#ffffff' }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/90 hover:bg-white
                       flex items-center justify-center shadow-2xl cursor-pointer border-0
                       transition-all duration-200"
            style={{ zIndex: 100001 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          {/* Image Display */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex items-center justify-center"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '100%',
              height: '100%',
            }}
          >
            <img
              src={imageUrl}
              alt={imageName}
              className="rounded-lg shadow-2xl"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </motion.div>

          {/* Download Button - Bottom Right */}
          <motion.button
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              const link = document.createElement('a');
              link.href = imageUrl;
              link.download = imageName;
              link.click();
            }}
            className="absolute bottom-6 right-6 px-5 py-3 rounded-full
                       font-semibold text-white cursor-pointer border-0
                       flex items-center gap-2 shadow-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              zIndex: 100001,
            }}
          >
            <i className="fas fa-download"></i>
            <span>Download</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageModal;
