import Navigation from "@/components/ui/navigation";
import { useMediaQuery } from "../hooks/use-media-query";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { isCollapsed } = useSidebar();

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
        "transition-[margin-left] duration-300 ease-in-out",
        isDesktop 
          ? (isCollapsed ? 'ml-12' : 'ml-64') 
          : 'ml-0',
        "px-4 py-3 md:px-6 md:py-4"
      )}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
