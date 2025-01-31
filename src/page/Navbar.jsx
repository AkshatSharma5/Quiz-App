"use client";
import React from "react";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import icon from "../assets/icon.png";
import aks from "../assets/akshat.jpg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Translate from "./Translate";
Translate;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <TooltipProvider>
      <header className="flex items-center justify-between py-3 px-6 bg-gradient-to-r from-blue-300 via-fuchsia-200 to-purple-200 shadow-md border-b-4 border-purple-300">
        <Link to="/">
          <div className="flex items-center gap-2">
            <img src={icon} alt="Logo" className="w-8 h-8 text-md" />
            <span className="text-xl font-semibold uppercase bg-gradient-to-r from-indigo-700 via-sky-600 to-purple-700 text-transparent bg-clip-text font-spaceGrotesk tracking-wider">
              QuizUp🚀 : The Best Quizzing Platform
            </span>
            <span className="font-semibold uppercase bg-gradient-to-r from-red-700 via-orange-600 to-pink-700 text-transparent bg-clip-text font-spaceGrotesk tracking-wider">
              (AI-powered) ✨
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-6 text-lg font-medium font-spaceGrotesk">
          <Link to="/" className="hover:text-blue-600">
            Home
          </Link>
          <span className="h-6 w-px bg-gray-500"></span>{" "}
          {/* Vertical Separator */}
          <Link to="/quiz" className="hover:text-blue-600">
            Quiz
          </Link>
          <span className="h-6 w-px bg-gray-500"></span>{" "}
          <span>
            <Dialog>
              <DialogTrigger>Translate</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle><Button>Translate:</Button></DialogTitle>
                  <DialogDescription>
                    <Translate />
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </span>
        </nav>

        {/* Right: Social Links & Credit */}
        <div className="flex items-center gap-4 font-spaceGrotesk">
          <Tooltip>
            <TooltipTrigger>
              <a
                href="https://github.com/AkshatSharma5"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub className="w-6 h-6 hover:text-gray-800" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>My Github</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <a
                href="https://www.linkedin.com/in/akshat-sharma-7914a7250/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin className="w-6 h-6 hover:text-blue-700" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>My Github</p>
            </TooltipContent>
          </Tooltip>

          <span className="text-sm">Made with ❤️ by Akshat</span>

          <Tooltip>
            <span className="text-sm">
              <TooltipTrigger>
                <a href="https://linktr.ee/akshat.iiti" target="_blank">
                  <img
                    src={aks}
                    alt="akshat"
                    className="rounded-full w-10 h-11"
                  />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>See my Portfolio!</p>
              </TooltipContent>
            </span>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
