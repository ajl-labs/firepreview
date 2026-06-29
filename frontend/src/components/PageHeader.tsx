import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string; // if omitted, uses navigate(-1)
}

export function PageHeader({ title, subtitle, backTo }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 pb-4 border-b">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div>
        <h1 className="text-lg font-semibold leading-none capitalize">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
