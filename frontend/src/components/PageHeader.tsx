import { useEffect } from "react";
import { useNavigate } from "react-router";
import { BookOpen, ChevronLeft, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDatabaseStore } from "@/store/database";
import { toast } from "sonner";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string | number; // a path, or a history offset like -1
}

export function PageHeader({ title, subtitle, backTo }: PageHeaderProps) {
  const navigate = useNavigate();
  const { disconnect, getConnectionStatus, config } = useDatabaseStore(
    (s) => s,
  );

  const handleLogout = async () => {
    try {
      await disconnect();
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to disconnect from Firestore.");
    }
  };

  useEffect(() => {
    getConnectionStatus();
  }, []);
  return (
    <div className="flex items-center gap-3 pb-4 border-b">
      {backTo && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            typeof backTo === "number" ? navigate(backTo) : navigate(backTo)
          }
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
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/docs")}
            >
              <BookOpen /> Query help
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="w-10"
              onClick={handleLogout}
            >
              <LogOutIcon />
            </Button>
          </div>
          {config && (
            <p className="text-sm text-muted-foreground">{config?.projectId}</p>
          )}
        </div>
      </div>
    </div>
  );
}
