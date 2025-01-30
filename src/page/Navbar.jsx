"use client"
import React from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export default function Navbar() {
  return (
    <div className="flex justify-center items-center py-3 bg-gradient-to-r from-blue-200 from-10% via-fuchsia-100 via-30% to-emerald-100 to-90%">
      <NavigationMenu>
        <NavigationMenuList>
        <NavigationMenuItem>
            <NavigationMenuTrigger>Home 🏠</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink className="flex h-full p-4 w-[9.5vw] text-slate-600 text-sm text-center">
                Go to Home Page
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger></NavigationMenuTrigger>
            <NavigationMenuContent>
            <NavigationMenuLink className="flex h-full p-4 w-[9.5vw] text-slate-600 text-sm text-center">
                Go to Home Page
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Item Three</NavigationMenuTrigger>
            <NavigationMenuContent>
            <NavigationMenuLink className="flex h-full p-4 w-[9.5vw] text-slate-600 text-sm text-center">
                Go to Home Page
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}