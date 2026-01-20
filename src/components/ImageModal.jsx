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
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 flex items-center z-[9999]"
          style={{ margin: 0, padding: '20px', justifyContent: 'center', paddingLeft: '320px' }}
        >
          {/* Image Container with Frame */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-slate-800 rounded-xl p-2 shadow-2xl max-w-[85vw] max-h-[85vh] flex items-center justify-center"
          >
            {/* Close Button (X) - Top Right of Image Frame */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.1 }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600
                         border-2 border-slate-500 text-white
                         flex items-center justify-center cursor-pointer
                         transition-all duration-200 shadow-lg"
              style={{ zIndex: 10000 }}
            >
              <i className="fas fa-times text-lg"></i>
            </motion.button>

            {/* Image Display */}
            <img
              src={imageUrl}
              alt={imageName}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />

            {/* Download Button - Bottom Right of Image Frame */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = imageName;
                link.click();
              }}
              className="absolute -bottom-3 right-4 px-5 py-2.5 rounded-full
                         bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700
                         text-white font-semibold cursor-pointer
                         flex items-center gap-2 shadow-xl transition-all duration-200"
            >
              <i className="fas fa-download"></i>
              <span>Download</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageModal;
