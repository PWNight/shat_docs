"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
              size="icon"
              className="relative h-9 w-9 rounded-full bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all duration-200 !focus:ring-0 !focus:outline-none"
          >
            <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400 absolute transition-all duration-300 ease-in-out transform rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
            <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400 absolute transition-all duration-300 ease-in-out transform rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Переключение темы</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-1"
        >
          <DropdownMenuItem
              onClick={() => setTheme("light")}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md cursor-pointer transition-colors duration-200"
          >
            <Sun className="h-4 w-4" />
            <span>Светлая</span>
            {theme === "light" && <span className="ml-auto text-green-500">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md cursor-pointer transition-colors duration-200"
          >
            <Moon className="h-4 w-4" />
            <span>Тёмная</span>
            {theme === "dark" && <span className="ml-auto text-green-500">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
              onClick={() => setTheme("system")}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md cursor-pointer transition-colors duration-200"
          >
            <Monitor className="h-4 w-4" />
            <span>Как в системе</span>
            {theme === "system" && <span className="ml-auto text-green-500">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}