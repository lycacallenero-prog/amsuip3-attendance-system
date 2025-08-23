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
    <div className={cn(
      "layout-container min-h-screen bg-background",
      isCollapsed && "sidebar-collapsed"
    )}>
      {/* Sidebar */}
      <div className={cn(
        "sidebar-fixed",
        isDesktop ? "block" : "hidden"
      )}>
        <Navigation />
      </div>
      
      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
