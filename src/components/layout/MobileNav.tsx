"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MobileNavProps {
  userPermissions?: string[];
}

export const MobileNav: React.FC<MobileNavProps> = ({ userPermissions }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="iconSm"
        onClick={() => setIsOpen(true)}
        aria-label="Open sidebar menu"
        className="text-slate-700"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-64 max-w-xs bg-brand-navy z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Close sidebar menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar className="w-full h-full border-none" userPermissions={userPermissions} />
          </div>
        </div>
      )}
    </div>
  );
};
