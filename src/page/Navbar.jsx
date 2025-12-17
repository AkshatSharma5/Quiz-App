"use client";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGithub, FaLinkedin, FaUser, FaSignOutAlt, FaTrophy, FaChartLine, FaBrain, FaPlus, FaGlobe, FaBook } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
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
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <TooltipProvider>
      <header className="flex flex-col gap-3 lg:flex-row items-center justify-between py-3 px-6 bg-gradient-to-r from-blue-300 via-fuchsia-200 to-purple-200 shadow-md border-b-4 border-purple-300">
        <Link to="/">
          <div className="flex items-center gap-2">
            <img src={icon} alt="Logo" className="w-8 h-8 text-md" />
            <span className="lg:text-xl font-semibold uppercase bg-gradient-to-r from-indigo-700 via-sky-600 to-purple-700 text-transparent bg-clip-text font-spaceGrotesk tracking-wider">
              QuizUp🚀
            </span>
            <span className="font-semibold uppercase bg-gradient-to-r from-red-700 via-orange-600 to-pink-700 text-transparent bg-clip-text font-spaceGrotesk tracking-wider text-sm">
              (AI-powered) ✨
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-4 text-sm font-medium font-spaceGrotesk flex-wrap justify-center">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span className="h-4 w-px bg-gray-400 hidden md:block"></span>
          
          <Link to="/quiz-setup" className="hover:text-blue-600 transition-colors">
            Play Quiz
          </Link>
          <span className="h-4 w-px bg-gray-400 hidden md:block"></span>
          
          <Link to="/browse-quizzes" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <FaGlobe className="text-xs" /> Community
          </Link>
          <span className="h-4 w-px bg-gray-400 hidden md:block"></span>
          
          <Link to="/study" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <FaBook className="text-xs" /> Study
          </Link>
          <span className="h-4 w-px bg-gray-400 hidden md:block"></span>
          
          <Link to="/leaderboard" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <FaTrophy className="text-xs text-yellow-600" /> Leaderboard
          </Link>
          <span className="h-4 w-px bg-gray-400 hidden md:block"></span>
          
          <Dialog>
            <DialogTrigger className="hover:text-blue-600 transition-colors">
              Translate
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  <Button>Translate:</Button>
                </DialogTitle>
                <DialogDescription>
                  <Translate />
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </nav>

        {/* Right: User Menu or Auth Buttons */}
        <div className="flex items-center gap-3 font-spaceGrotesk">
          {user && userProfile && (
            <StreakTracker size="mini" />
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 bg-white/50 hover:bg-white/80 rounded-full px-3 py-2 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {userProfile?.photoURL ? (
                      <img 
                        src={userProfile.photoURL} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      userProfile?.displayName?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <span className="text-sm font-medium hidden md:block">
                    {userProfile?.displayName?.split(' ')[0] || 'User'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{userProfile?.displayName}</span>
                    <span className="text-xs text-gray-500">Level {userProfile?.level || 1} • {userProfile?.xp || 0} XP</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <FaUser className="mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/analytics')}>
                  <FaChartLine className="mr-2" /> Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-quizzes')}>
                  <FaBrain className="mr-2" /> My Quizzes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/create-quiz')}>
                  <FaPlus className="mr-2" /> Create Quiz
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <FaSignOutAlt className="mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="text-sm"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm"
              >
                Sign Up
              </Button>
            </div>
          )}

          {/* Social Links */}
          <div className="hidden lg:flex items-center gap-2 ml-2">
            <Tooltip>
              <TooltipTrigger>
                <a
                  href="https://github.com/AkshatSharma5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGithub className="w-5 h-5 hover:text-gray-800 transition-colors" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>GitHub</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <a
                  href="https://www.linkedin.com/in/akshat-sharma-7914a7250/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin className="w-5 h-5 hover:text-blue-700 transition-colors" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>LinkedIn</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
