import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ElectronCollision() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  // 3 left electrons
  const leftElectrons = [
    { id: 'l1', delay: 0.1, duration: 1.2, startAngle: 60 },
    { id: 'l2', delay: 0.3, duration: 1.1, startAngle: 75 },
    { id: 'l3', delay: 0.0, duration: 1.4, startAngle: 45 },
  ];

  // 3 right electrons
  const rightElectrons = [
    { id: 'r1', delay: 0.2, duration: 1.15, startAngle: -60 },
    { id: 'r2', delay: 0.4, duration: 1.25, startAngle: -75 },
    { id: 'r3', delay: 0.1, duration: 1.35, startAngle: -45 },
  ];

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 pointer-events-none z-0 flex items-start justify-center pt-10">
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* Center impact flash */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0, 1, 0], scale: [0, 0, 1.5, 3] }}
              transition={{ duration: 2, times: [0, 0.6, 0.7, 1] }}
              className="absolute top-48 w-40 h-40 bg-[#39FF14] rounded-full blur-[50px] z-10"
            />

            {leftElectrons.map(el => (
              <motion.div
                key={el.id}
                className="absolute top-0"
                style={{ height: '12rem', transformOrigin: 'top center' }}
                initial={{ rotate: el.startAngle, opacity: 0 }}
                animate={{ rotate: 0, opacity: [0, 1, 0] }}
                transition={{ duration: el.duration, delay: el.delay, ease: "easeIn" }}
              >
                <div className="w-5 h-5 rounded-full bg-[#00A63E] dark:bg-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.8)] absolute bottom-0 -translate-x-1/2"></div>
                <div className="w-[2px] h-full bg-gradient-to-b from-transparent to-[#39FF14]/40 absolute top-0 -translate-x-1/2"></div>
              </motion.div>
            ))}

            {rightElectrons.map(el => (
              <motion.div
                key={el.id}
                className="absolute top-0"
                style={{ height: '12rem', transformOrigin: 'top center' }}
                initial={{ rotate: el.startAngle, opacity: 0 }}
                animate={{ rotate: 0, opacity: [0, 1, 0] }}
                transition={{ duration: el.duration, delay: el.delay, ease: "easeIn" }}
              >
                <div className="w-5 h-5 rounded-full bg-[#00A63E] dark:bg-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.8)] absolute bottom-0 -translate-x-1/2"></div>
                <div className="w-[2px] h-full bg-gradient-to-b from-transparent to-[#39FF14]/40 absolute top-0 -translate-x-1/2"></div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
