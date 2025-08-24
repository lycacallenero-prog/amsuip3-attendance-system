import Navigation from "@/components/ui/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className={cn(
      "layout-wrapper",
      isCollapsed && "sidebar-collapsed"
    )}>
      {/* Sidebar */}
      <div className="sidebar-desktop transition-[width] duration-300 ease-in-out">
        <Navigation />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 min-w-0 px-4 py-3 md:px-6 md:py-4 transition-[margin-left] duration-300 ease-in-out">
        {children}
      </main>
    </div>
  );
};

export default Layout;
