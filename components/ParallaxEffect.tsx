// app/ParallaxEffect.tsx (client component)
"use client";
import { useEffect } from "react";

export default function ParallaxEffect() {
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll<HTMLElement>('.section-background');
      const scrolled = window.scrollY;
      sections.forEach(section => {
        section.style.backgroundPosition = `0 ${scrolled * 0.8}px`;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
