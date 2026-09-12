"use client";
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaGithub, FaLinkedin, FaUser, FaSignOutAlt, FaTrophy, FaChartLine, FaBrain, FaPlus, FaGlobe, FaBook, FaSun, FaMoon, FaBars } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import icon from "../assets/icon.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Translate from "./Translate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import StreakTracker from "@/components/StreakTracker";

export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Play', path: '/quiz-setup' },
    { name: 'Community', path: '/browse-quizzes', icon: <FaGlobe /> },
    { name: 'Study', path: '/study', icon: <FaBook /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <FaTrophy className="text-yellow-500" /> }
  ];

  return (
    <TooltipProvider>
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <header className="glass-nav shadow-lg border-[var(--border-color)] pointer-events-auto w-full max-w-[1200px]">
          <div className="flex items-center justify-between py-3 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={icon} alt="Logo" className="w-8 h-8 transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold tracking-tight text-[var(--text-main)]">
              QuizUp<span className="text-[#00A63E] dark:text-[#39FF14]">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`flex items-center gap-1.5 transition-colors hover:text-[#00A63E] dark:hover:text-[#39FF14] ${location.pathname === link.path ? 'text-[#00A63E] dark:text-[#39FF14]' : 'text-[var(--text-main)]'}`}
              >
                {link.icon && <span className="text-xs opacity-70">{link.icon}</span>}
                {link.name}
              </Link>
            ))}
            
            <Dialog>
              <DialogTrigger className="text-[var(--text-main)] hover:text-[#00A63E] dark:hover:text-[#39FF14] transition-colors text-sm font-semibold">
                Translate
              </DialogTrigger>
              <DialogContent className="glass-panel border-[var(--border-color)]">
                <DialogHeader>
                  <DialogTitle className="text-[var(--text-main)] font-bold">Translate</DialogTitle>
                  <DialogDescription>
                    <Translate />
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {user && userProfile && (
              <div className="hidden sm:block">
                <StreakTracker size="mini" />
              </div>
            )}

            <button 
              onClick={toggleTheme} 
              className="px-3 h-9 flex items-center justify-center gap-2 rounded-full bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--text-muted)] transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <><FaMoon className="text-sm" /><span className="text-xs font-bold hidden sm:inline">Dark</span></>
              ) : (
                <><FaSun className="text-sm" /><span className="text-xs font-bold hidden sm:inline">Light</span></>
              )}
            </button>

            <a href="https://github.com/AkshatSharma5/Quiz-App" target="_blank" rel="noopener noreferrer" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--text-muted)] hover:text-[#333] dark:hover:text-white transition-all">
              <FaGithub className="text-base" />
            </a>
            <a href="https://linkedin.com/in/akshat7" target="_blank" rel="noopener noreferrer" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[#0077b5] hover:text-[#0077b5] transition-all">
              <FaLinkedin className="text-base" />
            </a>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-[var(--border-color)] p-1 pr-3 hover:bg-[var(--bg-base)] transition-colors outline-none">
                    <div className="w-8 h-8 rounded-full bg-[var(--text-main)] text-[var(--bg-surface)] flex items-center justify-center font-bold text-sm">
                      {userProfile?.photoURL ? (
                        <img src={userProfile.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        userProfile?.displayName?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <span className="text-sm font-bold hidden md:block text-[var(--text-main)]">
                      {userProfile?.displayName?.split(' ')[0] || 'User'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-panel border-[var(--border-color)] text-[var(--text-main)] mt-2">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-bold">{userProfile?.displayName}</span>
                      <span className="text-xs text-[var(--text-muted)]">Level {userProfile?.level || 1} • {userProfile?.xp || 0} XP</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--border-color)]" />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="focus:bg-[var(--bg-base)] focus:text-[var(--text-main)] cursor-pointer"><FaUser className="mr-2" /> Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/analytics')} className="focus:bg-[var(--bg-base)] focus:text-[var(--text-main)] cursor-pointer"><FaChartLine className="mr-2" /> Analytics</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-quizzes')} className="focus:bg-[var(--bg-base)] focus:text-[var(--text-main)] cursor-pointer"><FaBrain className="mr-2" /> My Quizzes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/create-quiz')} className="focus:bg-[var(--bg-base)] focus:text-[var(--text-main)] cursor-pointer"><FaPlus className="mr-2" /> Create Quiz</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[var(--border-color)]" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer">
                    <FaSignOutAlt className="mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/login')} className="hidden sm:block text-sm font-semibold text-[var(--text-main)] px-3 py-2 hover:text-[var(--text-muted)] transition-colors">Log In</button>
                <button onClick={() => navigate('/register')} className="btn-primary text-sm">Sign Up</button>
              </div>
            )}

            {/* Mobile Menu Toggle (simplified for now to just show dropdown of links on click, or simply keep as horizontal scroll on phones) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)]">
                  <FaBars />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass-panel border-[var(--border-color)] md:hidden">
                {navLinks.map((link) => (
                  <DropdownMenuItem key={link.name} onClick={() => navigate(link.path)} className="focus:bg-[var(--bg-base)] cursor-pointer">
                    {link.icon && <span className="mr-2 opacity-70">{link.icon}</span>}
                    {link.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      </div>
    </TooltipProvider>
  );
}
