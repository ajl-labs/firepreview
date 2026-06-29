import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDatabaseStore } from "@/store/database";
import { useNavigate } from "react-router";

export const AuthScreen = () => {
  const navigate = useNavigate();
  const database = useDatabaseStore((state) => state);

  const handleSignIn = async () => {
    await database.connect({
      credentialsPath: "path/to/your/serviceAccountKey.json",
      projectId: "tupandeonline-dev",
      useEmulator: true,
    });
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button onClick={handleSignIn} disabled={database.connecting}>
        {database.connecting ? <Spinner data-icon="inline-start" /> : null}
        Sign in with Google
      </Button>
    </div>
  );
};
