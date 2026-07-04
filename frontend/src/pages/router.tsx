import { createHashRouter, Navigate, Outlet } from "react-router";
import { ExplorerPage } from "./explorer";
import { AuthScreen } from "./auth";
import { useDatabaseStore } from "@/store/database";
import { CollectionPage } from "./collection";
import { RouteErrorBoundary } from "./Error";
import { PageHeader } from "@/components/PageHeader";

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
