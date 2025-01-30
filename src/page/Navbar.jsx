"use client";
import React from "react";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import icon from "../assets/icon.png"

export default function Navbar() {
  return (
    <header className="flex items-center justify-between py-3 px-6 bg-gradient-to-r from-blue-200 via-fuchsia-100 to-purple-100 shadow-md border-b-4 border-purple-700">    
      <div className="flex items-center gap-2">
        <img src={icon} alt="Logo" className="w-8 h-8 text-md" />
        <span className="text-xl font-semibold uppercase bg-gradient-to-r from-indigo-700 via-sky-600 to-purple-700 text-transparent bg-clip-text font-bioRhyme">
  QuizUp: The Best Quizzing Platform
</span>
 </div>

      {/* Center: Navigation Links */}
      <nav className="flex items-center gap-6 text-lg font-medium">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span className="h-6 w-px bg-gray-500"></span> {/* Vertical Separator */}
        <Link to="/quiz" className="hover:text-blue-600">Quiz</Link>
      </nav>

      {/* Right: Social Links & Credit */}
      <div className="flex items-center gap-4">
        <a href="https://github.com/AkshatSharma5" target="_blank" rel="noopener noreferrer">
          <FaGithub className="w-6 h-6 hover:text-gray-800" />
        </a>
        <a href="https://www.linkedin.com/in/akshat-sharma-7914a7250/" target="_blank" rel="noopener noreferrer">
          <FaLinkedin className="w-6 h-6 hover:text-blue-700" />
        </a>
        <span className="text-sm">Made with ❤️ by Akshat</span>
      </div>
    </header>
  );
}
