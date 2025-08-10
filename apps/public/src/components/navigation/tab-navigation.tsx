"use client";

import type { Category } from "@minimall/core/client";
import { cn } from "@minimall/ui";
import { useEffect, useMemo, useState } from "react";

interface TabNavigationProps {
  categories: Category[];
  className?: string;
  onTabChange?: (categoryId: string) => void;
}

export function TabNavigation({ categories, className, onTabChange }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState<string>("");
  const [isSticky, setIsSticky] = useState(false);

  const visibleCategories = useMemo(
    () =>
      categories
        .filter((category) => category.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [categories]
  );

  // Set initial active tab
  useEffect(() => {
    if (visibleCategories.length > 0 && !activeTab) {
      const firstCategory = visibleCategories[0];
      if (firstCategory) {
        setActiveTab(firstCategory.id);
      }
    }
  }, [visibleCategories, activeTab]);

  // Handle sticky navigation on scroll
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsSticky(scrollTop > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTabClick = (categoryId: string) => {
    setActiveTab(categoryId);
    onTabChange?.(categoryId);

    // Smooth scroll to section
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const element = document.getElementById(categoryId);
      if (element) {
        const offset = 80; // Account for sticky header
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  if (visibleCategories.length <= 1) {
    return null;
  }

  return (
    <nav
      className={cn(
        "w-full bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300 z-40",
        isSticky && "fixed top-0 shadow-sm",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-8 py-4 min-w-max">
              {visibleCategories.map((category) => {
                const isActive = activeTab === category.id;

                return (
                  <button
                    key={category.id}
                    className={cn(
                      "relative whitespace-nowrap px-1 py-2 text-sm font-medium transition-all duration-200 hover:text-primary",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => handleTabClick(category.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${category.id}`}
                  >
                    {category.title.toUpperCase()}

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}

                    {/* Hover indicator */}
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 h-0.5 bg-primary/30 rounded-full transition-all duration-200",
                        isActive ? "opacity-0" : "opacity-0 hover:opacity-100"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile scroll indicator */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </nav>
  );
}
