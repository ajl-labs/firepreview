import { createHashRouter, Navigate, Outlet } from "react-router";
import { ExplorerPage } from "./explorer";
import { AuthScreen } from "./auth";
import { useDatabaseStore } from "@/store/database";
import { CollectionPage } from "./collection";

export const ProtectedRoute = () => {
  const connected = useDatabaseStore((s) => s.connected);
  return connected ? <Outlet /> : <Navigate to="/auth" replace />;
};

export const router = createHashRouter([
  { path: "/auth", element: <AuthScreen /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <ExplorerPage />,
      },
      {
        path: "/collection/:collectionName",
        element: <CollectionPage />,
      },
    ],
  },
]);
