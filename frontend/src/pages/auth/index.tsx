// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Spinner } from "@/components/ui/spinner";
// import { useDatabaseStore } from "@/store/database";
// import { useNavigate } from "react-router";

// export const AuthScreen = () => {
//   const navigate = useNavigate();
//   const database = useDatabaseStore((state) => state);

//   const handleSignIn = async () => {
//     await database.connect({
//       credentialsPath: "path/to/your/serviceAccountKey.json",
//       projectId: "tupandeonline-dev",
//       useEmulator: true,
//     });
//     navigate("/");
//   };

//   return (
//     <div className="flex flex-col items-center justify-center h-screen gap-4">
//       <Input className="w-1/3" placeholder="path to serviceAccount.json" />
//       <Button
//         onClick={handleSignIn}
//         disabled={database.connecting}
//         className="w-1/3"
//       >
//         {database.connecting ? <Spinner data-icon="inline-start" /> : null}
//         Connect to Firestore
//       </Button>
//     </div>
//   );
// };

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useDatabaseStore } from "@/store/database";
import { useNavigate } from "react-router";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z
  .object({
    projectId: z.string().min(1, "Project ID is required."),
    useEmulator: z.boolean(),
    credentialsPath: z.string(),
    emulatorHost: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.useEmulator) {
      if (!data.emulatorHost || data.emulatorHost.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Emulator host is required (e.g. localhost:8080).",
          path: ["emulatorHost"],
        });
      }
    } else {
      if (!data.credentialsPath || data.credentialsPath.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Path to serviceAccountKey.json is required.",
          path: ["credentialsPath"],
        });
      }
    }
  });

export const AuthScreen = () => {
  const navigate = useNavigate();
  const database = useDatabaseStore((state) => state);

  const onSubmit = async ({ value }: { value: z.infer<typeof formSchema> }) => {
    try {
      await database.connect(
        value.useEmulator
          ? {
              projectId: value.projectId,
              useEmulator: true,
              emulatorHost: value.emulatorHost,
              credentialsPath: "",
            }
          : {
              projectId: value.projectId,
              useEmulator: false,
              credentialsPath: value.credentialsPath,
              emulatorHost: "",
            },
      );
      navigate("/");
    } catch (err) {
      toast("Failed to connect", {
        description: err instanceof Error ? err.message : String(err),
        position: "bottom-right",
      });
    }
  };

  const form = useForm({
    defaultValues: {
      projectId: "tupandeonline-dev",
      useEmulator: true,
      credentialsPath: "",
      emulatorHost: "localhost:8000",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Connect to Firestore</CardTitle>
          <CardDescription>
            Connect using a service account file, or point at a local emulator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="form-firestore-connect"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="projectId"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="form-firestore-project-id">
                        Project ID
                      </FieldLabel>
                      <Input
                        id="form-firestore-project-id"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="tupandeonline-dev"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="useEmulator"
                children={(field) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id="form-firestore-use-emulator"
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked === true)
                      }
                    />
                    <FieldLabel
                      htmlFor="form-firestore-use-emulator"
                      className="font-normal"
                    >
                      Use local Firestore emulator
                    </FieldLabel>
                  </Field>
                )}
              />

              <form.Subscribe
                selector={(state) => state.values.useEmulator}
                children={(useEmulator) =>
                  useEmulator ? (
                    <form.Field
                      name="emulatorHost"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor="form-firestore-emulator-host">
                              Emulator host
                            </FieldLabel>
                            <Input
                              id="form-firestore-emulator-host"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="localhost:8080"
                            />
                            <FieldDescription>
                              Host and port of your running Firestore emulator.
                            </FieldDescription>
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        );
                      }}
                    />
                  ) : (
                    <form.Field
                      name="credentialsPath"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor="form-firestore-credentials-path">
                              Service account file path
                            </FieldLabel>
                            <Input
                              id="form-firestore-credentials-path"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="path/to/your/serviceAccountKey.json"
                            />
                            <FieldDescription>
                              Absolute path to your serviceAccountKey.json.
                            </FieldDescription>
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        );
                      }}
                    />
                  )
                }
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field orientation="horizontal">
            <Button type="submit" form="form-firestore-connect">
              {database.connecting ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Connect to Firestore
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
};
