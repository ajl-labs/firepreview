import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Example = {
  query: string;
  description: string;
};

type Operator = {
  operator: string;
  meaning: string;
  example: string;
};

const OPERATORS: Operator[] = [
  { operator: "==", meaning: "Equal to", example: "status == active" },
  { operator: "!=", meaning: "Not equal to", example: "status != archived" },
  { operator: "<", meaning: "Less than", example: "attempts < 3" },
  { operator: "<=", meaning: "Less than or equal to", example: "price <= 9.99" },
  { operator: ">", meaning: "Greater than", example: "attempts > 0" },
  { operator: ">=", meaning: "Greater than or equal to", example: "attempts >= 2" },
  {
    operator: "in",
    meaning: "Equal to any value in the list",
    example: "status in [open, pending]",
  },
  {
    operator: "not-in",
    meaning: "Not equal to any value in the list",
    example: "status not-in [closed, archived]",
  },
  {
    operator: "array-contains",
    meaning: "The array field contains the value",
    example: "tags array-contains urgent",
  },
  {
    operator: "array-contains-any",
    meaning: "The array field contains any value in the list",
    example: "tags array-contains-any [urgent, vip]",
  },
];

const VALUE_TYPES: Example[] = [
  { query: "attempts == 0", description: "Whole number" },
  { query: "price >= 2.5", description: "Decimal number" },
  { query: "active == true", description: "Boolean (true or false)" },
  {
    query: 'code == "123"',
    description: "Quoted text. Use quotes for numbers or booleans stored as text",
  },
  {
    query: "name == John Doe",
    description: "Unquoted text, spaces allowed",
  },
  {
    query: 'status in [open, "on hold", 3]',
    description: "List of values, separated by commas",
  },
];

const FILTER_EXAMPLES: Example[] = [
  {
    query: "functionName == completeOdooOrder",
    description: "Documents where functionName is completeOdooOrder",
  },
  {
    query: "functionName == completeOdooOrder AND attempts >= 2",
    description: "Both conditions must match",
  },
  {
    query: "address.city == Kigali",
    description: "Use a dot to filter on a field inside a map",
  },
];

const DELETE_EXAMPLES: Example[] = [
  {
    query: "DELETE WHERE status == archived",
    description: "Delete every archived document in this collection",
  },
  {
    query: "DELETE WHERE functionName == completeOdooOrder AND attempts == 0",
    description: "Delete only documents matching both conditions",
  },
];

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      aria-label="Copy query"
    >
      {copied ? <Check className="text-green-500" /> : <Copy />}
    </Button>
  );
};

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
    {children}
  </code>
);

const ExampleList = ({ examples }: { examples: Example[] }) => (
  <div className="divide-y rounded-lg border">
    {examples.map(({ query, description }) => (
      <div key={query} className="flex items-center gap-3 px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <code className="font-mono text-xs break-all">{query}</code>
          <span className="text-muted-foreground text-xs">{description}</span>
        </div>
        <CopyButton value={query} />
      </div>
    ))}
  </div>
);

export const DocsPage = () => (
  <PageContainer title="Query reference" subtitle="Documentation" backTo={-1}>
    <div className="mx-auto grid w-full max-w-6xl gap-4 pb-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Filter a collection</CardTitle>
          <CardDescription>
            Type a query in the box above a collection's table and click Run.
            Leave the box empty to show every document.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p>
            A condition is <Code>field operator value</Code>, with a space on
            each side of the operator. Join conditions with{" "}
            <Code>AND</Code> in capitals; every condition must match.{" "}
            <Code>OR</Code> isn't supported.
          </p>
          <ExampleList examples={FILTER_EXAMPLES} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Operator</th>
                  <th className="px-3 py-2 font-medium">Meaning</th>
                  <th className="px-3 py-2 font-medium">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {OPERATORS.map(({ operator, meaning, example }) => (
                  <tr key={operator}>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                      {operator}
                    </td>
                    <td className="px-3 py-2">{meaning}</td>
                    <td className="px-3 py-2 font-mono text-xs">{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Values</CardTitle>
          <CardDescription>
            The value's type must match the stored field. For example,{" "}
            <Code>attempts == 0</Code> won't match a field stored as the text{" "}
            <Code>"0"</Code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExampleList examples={VALUE_TYPES} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete matching documents</CardTitle>
          <CardDescription>
            Start the query with <Code>DELETE WHERE</Code> to delete from the
            collection you're viewing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ExampleList examples={DELETE_EXAMPLES} />
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Before anything is deleted, a window shows how many documents
              match and what share of the collection that is. Click Delete to
              confirm or Cancel to stop.
            </li>
            <li>
              The <Code>WHERE</Code> part is required, so a query can't empty a
              whole collection by mistake.
            </li>
            <li>Deleted documents can't be recovered.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit a document</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Open a document from the table, click Edit, change the JSON,
              then click Save.
            </li>
            <li>
              Only the fields you change are saved. Add a key to add a field;
              remove a key to delete that field.
            </li>
            <li>
              Timestamps are edited as dates like{" "}
              <Code>2026-01-31T09:00:00Z</Code>.
            </li>
            <li>
              If someone else changed the document while you were editing, the
              save fails. Reopen the document and try again.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Good to know</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              With a range filter (<Code>&lt;</Code>, <Code>&lt;=</Code>,{" "}
              <Code>&gt;</Code>, <Code>&gt;=</Code>, <Code>!=</Code>,{" "}
              <Code>not-in</Code>), results are sorted by that field. Documents
              without the field are left out.
            </li>
            <li>
              Combining <Code>==</Code> on one field with a range filter on
              another may need a composite index. Firestore's error message
              includes a link that creates it.
            </li>
            <li>
              Firestore limits list sizes: up to 30 values for{" "}
              <Code>in</Code> and <Code>array-contains-any</Code>, and up to 10
              for <Code>not-in</Code>.
            </li>
            <li>
              List items are split on commas, so a quoted value can't contain a
              comma.
            </li>
            <li>
              Filtering by date or <Code>null</Code> isn't supported yet.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </PageContainer>
);
