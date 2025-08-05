import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [fontColor, setFontColor] = useState("default");

  useEffect(() => {
    if (theme === "dark") {
      handleFontColorChange("white");
    } else {
      // Set dark font color for general text
      handleFontColorChange("default");
      // Set white font color specifically for header
      const header = document.querySelector("header");
      if (header) {
        header.style.setProperty("--foreground", "0 0% 100%");
      }
    }
  }, [theme]);

  const handleFontColorChange = (color: string) => {
    setFontColor(color);
    const root = document.documentElement;
    
    switch (color) {
      case "warm":
        root.style.setProperty("--foreground", "30 8% 15%");
        break;
      case "cool":
        root.style.setProperty("--foreground", "210 40% 20%");
        break;
      case "vibrant":
        root.style.setProperty("--foreground", "270 50% 25%");
        break;
      case "white":
        root.style.setProperty("--foreground", "0 0% 100%");
        break;
      default:
        root.style.removeProperty("--foreground");
        break;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Theme Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Color Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Palette className="h-4 w-4" />
            <span className="sr-only">Change font color</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm">
          <DropdownMenuItem onClick={() => handleFontColorChange("default")}>
            <div className="w-4 h-4 rounded-full bg-foreground mr-2" />
            Default
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFontColorChange("warm")}>
            <div className="w-4 h-4 rounded-full bg-amber-800 mr-2" />
            Warm
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFontColorChange("cool")}>
            <div className="w-4 h-4 rounded-full bg-blue-800 mr-2" />
            Cool
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFontColorChange("vibrant")}>
            <div className="w-4 h-4 rounded-full bg-purple-800 mr-2" />
            Vibrant
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFontColorChange("white")}>
            <div className="w-4 h-4 rounded-full bg-white border border-gray-300 mr-2" />
            White
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};