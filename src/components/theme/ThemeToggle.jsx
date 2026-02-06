import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-14 h-7 rounded-full transition-all duration-300",
        "backdrop-blur-xl border border-white/20",
        isDark 
          ? "bg-gradient-to-r from-purple-500/30 to-red-500/30" 
          : "bg-gradient-to-r from-blue-400/30 to-pink-400/30"
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300",
          "backdrop-blur-md border border-white/40 shadow-lg",
          isDark 
            ? "left-0.5 bg-purple-100/90" 
            : "left-7 bg-pink-100/90"
        )}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-purple-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        ) : (
          <Sun className="w-4 h-4 text-pink-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
      </div>
    </button>
  );
}