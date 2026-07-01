import React, { useEffect } from "react";
import { Sun, Moon } from "lucide-react";

type ThemeToggleProps = {
  isDark: boolean;
  toggleTheme: () => void;
};

export default function ThemeToggle({ isDark, toggleTheme }: ThemeToggleProps) {
  // Ensure system sync on mount
  useEffect(() => {
    const classList = document.documentElement.classList;
    if (isDark) {
      classList.add("dark");
    } else {
      classList.remove("dark");
    }
  }, [isDark]);

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/80 hover:bg-white border border-gray-200 shadow-sm"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
