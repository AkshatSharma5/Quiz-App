import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FEATURES = [
  { 
    id: 1, 
    title: 'AI-Powered Generation', 
    desc: 'Transform any topic into a comprehensive quiz instantly using our advanced generative AI engine. Just type and let the magic happen.', 
    icon: '🤖', 
    gradient: 'from-[#39FF14]/20 to-transparent'
  },
  { 
    id: 2, 
    title: 'Real-time Analytics', 
    desc: 'Track your progress, identify weak points, and watch your accuracy soar with detailed, beautifully crafted visual insights.', 
    icon: '⚡', 
    gradient: 'from-[#00A63E]/20 to-transparent'
  },
  { 
    id: 3, 
    title: 'Global Community', 
    desc: 'Compete on dynamic leaderboards and explore thousands of high-quality quizzes curated by passionate learners worldwide.', 
    icon: '🌍', 
    gradient: 'from-[#39FF14]/20 to-transparent'
  },
  { 
    id: 4, 
    title: 'Interactive Study Modes', 
    desc: 'Master subjects faster with flashcards, spaced repetition algorithms, and adaptive difficulty that scales to your skill level.', 
    icon: '🧠', 
    gradient: 'from-[#00A63E]/20 to-transparent'
  },
  { 
    id: 5, 
    title: 'Multiplayer Challenges', 
    desc: 'Go head-to-head with friends or random opponents in real-time quiz battles. Prove your dominance on the global stage.', 
    icon: '⚔️', 
    gradient: 'from-[#39FF14]/20 to-transparent'
  }
];

export default function FeatureAccordion() {
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === FEATURES.length ? 1 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="feature-accordion w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-stretch">
      {/* Left side: Compact Tabs */}
      <div className="feature-tabs lg:w-1/3 flex flex-col gap-3">
        {FEATURES.map((feature) => {
          const isActive = activeTab === feature.id;
          return (
            <div 
              key={feature.id}
              onClick={() => setActiveTab(feature.id)}
              className={`cursor-pointer rounded-xl p-4 transition-all duration-300 border-[1px] relative overflow-hidden flex items-center gap-4 ${
                isActive 
                  ? 'bg-[var(--bg-surface)] border-[#39FF14]/50 shadow-[0_0_20px_rgba(57,255,20,0.2)] scale-105 z-10' 
                  : 'bg-transparent border-transparent hover:bg-[var(--bg-surface)] hover:border-[var(--border-color)] opacity-70 hover:opacity-100'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeFeatureBgTab"
                  className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-30`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              
              <div className={`relative z-10 w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all duration-300 ${
                isActive ? 'bg-[#00A63E]/20 dark:bg-[#39FF14]/20' : 'bg-transparent grayscale'
              }`}>
                {feature.icon}
              </div>
              <h3 className={`relative z-10 text-sm md:text-base font-bold leading-snug transition-colors duration-300 ${
                isActive ? 'text-[#00A63E] dark:text-[#39FF14]' : 'text-[var(--text-main)]'
              }`}>
                {feature.title}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Right side: Large Horizontal Banner */}
      <div className="feature-showcase lg:w-2/3 glass-panel rounded-3xl border-[rgba(57,255,20,0.3)] p-6 md:p-8 flex items-center relative overflow-hidden shadow-[0_0_40px_rgba(57,255,20,0.1)] group">
        
        {/* Striking Background Animations */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00A63E]/20 dark:bg-[#39FF14]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#00A63E]/10 dark:bg-[#39FF14]/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
        
        <AnimatePresence mode="wait">
          {FEATURES.map((feature) => (
            feature.id === activeTab && (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                className="feature-showcase-content relative z-10 flex flex-col items-center gap-4 w-full"
              >
                {/* Floating Icon Element */}
                <motion.div 
                  animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-[1.5rem] bg-gradient-to-br from-[#00A63E]/30 to-[#39FF14]/10 flex items-center justify-center text-4xl md:text-5xl shadow-[0_0_35px_rgba(57,255,20,0.3)] border border-[rgba(57,255,20,0.5)] backdrop-blur-md"
                >
                  {feature.icon}
                </motion.div>
                
                {/* Text Content */}
                <div className="text-center w-full min-w-0">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-2xl md:text-3xl font-black text-[var(--text-main)] mb-3 tracking-tight leading-tight"
                  >
                    {feature.title}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-sm md:text-base text-[var(--text-muted)] font-medium leading-relaxed max-w-2xl"
                  >
                    {feature.desc}
                  </motion.p>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
