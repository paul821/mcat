"use client";

import { useEffect, useState } from "react";
import { getThemeForNow } from "@/lib/theme";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const currentTheme = getThemeForNow();
    setTheme(currentTheme);

    // Re-check every 5 minutes
    const interval = setInterval(() => {
      setTheme(getThemeForNow());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
