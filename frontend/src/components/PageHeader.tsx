import { useNavigate } from "react-router";
import { ChevronLeft, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDatabaseStore } from "@/store/database";
import { toast } from "sonner";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string; // if omitted, uses navigate(-1)
}

export function PageHeader({ title, subtitle, backTo }: PageHeaderProps) {
  const navigate = useNavigate();
  const { disconnect } = useDatabaseStore((s) => s);

  const handleLogout = async () => {
    try {
      await disconnect();
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to disconnect from Firestore.");
    }
  };

  return (
    <div className="flex items-center gap-3 pb-4 border-b">
      {backTo && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      <div className="flex flex-row items-center justify-between w-full">
        <div>
          <h1 className="text-lg font-semibold leading-none capitalize">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div>
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOutIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
