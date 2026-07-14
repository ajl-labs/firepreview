import { useState, useEffect, useCallback } from "react";
import { createHashRouter, Navigate, Outlet } from "react-router";
import { ExplorerPage } from "./explorer";
import { AuthScreen } from "./auth";
import { useDatabaseStore } from "@/store/database";
import { CollectionPage } from "./collection";
import { RouteErrorBoundary } from "./Error";
import { Spinner } from "@/components/ui/spinner";

export const ProtectedRoute = () => {
  const connected = useDatabaseStore((s) => s.connected);
  return connected ? <Outlet /> : <Navigate to="/auth" replace />;
};

const PageLayout = () => (
  <>
    <Outlet />
  </>
);

const DefaultRoute = () => {
  const connected = useDatabaseStore((s) => s.connected);
  const [loading, setIsLoading] = useState(true);

  const checkConnection = useCallback(async () => {
    try {
      await useDatabaseStore.getState().getConnectionStatus();
    } catch (e) {
      console.error("Error checking database connection:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="size-12" />
      </div>
    );
  }

  return connected ? (
    <Navigate to="/explorer" replace />
  ) : (
    <Navigate to="/auth" replace />
  );
};

export const router = createHashRouter([
  { path: "/", element: <DefaultRoute /> },
  { path: "/auth", element: <AuthScreen /> },
  {
    errorElement: <RouteErrorBoundary />,
    element: <ProtectedRoute />,
    children: [
      {
        element: <PageLayout />,
        children: [
          {
            path: "/explorer",
            element: <ExplorerPage />,
          },
          {
            path: "/collection/:collectionName",
            element: <CollectionPage />,
          },
        ],
      },
    ],
  },
]);
