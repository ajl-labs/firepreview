import React from "react";
import { PageHeader } from "./PageHeader";

interface PageContainerProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  backTo,
  children,
}) => (
  <div className="p-6 space-y-4">
    <PageHeader
      title={decodeURIComponent(title)}
      subtitle={subtitle}
      backTo={backTo}
    />
    {children}
  </div>
);
