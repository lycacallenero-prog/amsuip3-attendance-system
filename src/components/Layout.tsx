import Navigation from "@/components/ui/navigation";
import { useMediaQuery } from "../hooks/use-media-query";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { isCollapsed } = useSidebar();
  const [isInitialized, setIsInitialized] = useState(false);

  // Prevent transition on initial load to avoid sliding effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 50); // Reduced delay for faster initialization
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full z-40",
        "transition-[width] duration-300 ease-in-out",
        isDesktop ? "block" : "hidden",
        isCollapsed ? "w-12" : "w-64"
      )}>
        <Navigation />
      </div>
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 min-w-0",
        // Always apply correct margin, only delay the transition
        isDesktop 
          ? (isCollapsed ? 'ml-12' : 'ml-64') 
          : 'ml-0',
        // Only add transition after initialization
        isInitialized && "transition-[margin-left] duration-300 ease-in-out",
        "px-4 py-3 md:px-6 md:py-4"
      )}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
