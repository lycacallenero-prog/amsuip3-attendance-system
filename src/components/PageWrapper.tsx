import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface PageWrapperProps {
  children: React.ReactNode;
  showSkeleton?: boolean;
  skeletonType?: 'dashboard' | 'table' | 'form';
}

const PageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <div>
      {children}
    </div>
  );
};

export default PageWrapper;