// import { useState, KeyboardEvent } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { X } from "lucide-react";
// import { database } from "../../wailsjs/go/models";
// export interface QueryClause {
//   field: string;
//   operator: string;
//   value: string;
//   join?: "AND" | "OR"; // how this clause connects to the next
// }

// const OPERATORS = ["==", "!=", ">", ">=", "<", "<=", "array-contains", "in"];

// // Parses: field operator value
// // e.g. "status == active" or "age >= 18"
// function parseClause(input: string): QueryClause | null {
//   const op = OPERATORS.find((o) => input.includes(` ${o} `));
//   if (!op) return null;

//   const [field, ...rest] = input.split(` ${op} `);
//   const value = rest.join(` ${op} `).trim();

//   return {
//     field: field.trim().replace(/^"|"$/g, ""),
//     operator: op,
//     value: value.trim().replace(/^"|"$/g, ""),
//   };
// }

// interface QueryInputProps {
//   onQuery: (clauses: QueryClause[]) => void;
//   fields?: database.FieldInfo[]; // optional list of fields for autocomplete
// }

// export const QueryInput = ({ onQuery, fields }: QueryInputProps) => {
//   const [input, setInput] = useState("");
//   const [clauses, setClauses] = useState<QueryClause[]>([]);
//   const [error, setError] = useState("");

//   function addClause(join?: "AND" | "OR") {
//     const clause = parseClause(input.trim());
//     if (!clause) {
//       setError(
//         `Invalid format. Use: field operator value  (e.g. status == active)`,
//       );
//       return;
//     }

//     // attach join to the previous clause
//     const updated = clauses.map((c, i) =>
//       i === clauses.length - 1 ? { ...c, join } : c,
//     );

//     setClauses([...updated, clause]);
//     setInput("");
//     setError("");
//   }

//   function removeClause(index: number) {
//     const updated = clauses.filter((_, i) => i !== index);
//     setClauses(updated);
//   }

//   function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
//     if (e.key === "Enter") addClause();
//   }

//   function handleRun() {
//     const finalClause = parseClause(input.trim());
//     const all = finalClause ? [...clauses, finalClause] : clauses;
//     if (all.length === 0) return;
//     setClauses(all);
//     setInput("");
//     onQuery(all);
//   }

//   function handleClear() {
//     setClauses([]);
//     setInput("");
//     setError("");
//   }

//   return (
//     <div className="space-y-2 w-full">
//       {/* Active clauses */}
//       {clauses.length > 0 && (
//         <div className="flex flex-wrap items-center gap-2 p-2 rounded-md border bg-muted/30">
//           {clauses.map((clause, i) => (
//             <div key={i} className="flex items-center gap-1">
//               <Badge variant="secondary" className="font-mono text-xs gap-1">
//                 {clause.field}
//                 <span className="text-muted-foreground">{clause.operator}</span>
//                 {clause.value}
//                 <button onClick={() => removeClause(i)}>
//                   <X className="h-3 w-3" />
//                 </button>
//               </Badge>
//               {clause.join && (
//                 <span className="text-xs font-semibold text-muted-foreground">
//                   {clause.join}
//                 </span>
//               )}
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Input row */}
//       <div className="flex gap-2">
//         <Input
//           value={input}
//           onChange={(e) => {
//             setInput(e.target.value);
//             setError("");
//           }}
//           onKeyDown={handleKeyDown}
//           placeholder={`field == value  ·  age >= 18  ·  status != pending`}
//           className="font-mono text-lg h-10"
//         />
//         {clauses.length > 0 && (
//           <>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => addClause("AND")}
//             >
//               AND
//             </Button>
//             <Button variant="outline" size="sm" onClick={() => addClause("OR")}>
//               OR
//             </Button>
//           </>
//         )}
//         <Button
//           onClick={handleRun}
//           size="lg"
//           className="h-10"
//           disabled={!input && clauses.length === 0}
//         >
//           Run
//         </Button>
//         {clauses.length > 0 && (
//           <Button
//             variant="ghost"
//             size="lg"
//             className="h-10"
//             onClick={handleClear}
//           >
//             Clear
//           </Button>
//         )}
//       </div>

//       {error && <p className="text-xs text-destructive">{error}</p>}
//     </div>
//   );
// };

import {
  IconBrandJavascript,
  IconBrandFirebase,
  IconCopy,
  IconCornerDownLeft,
  IconRefresh,
} from "@tabler/icons-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

interface QueryInputProps {
  onQuery: (clauses: any[]) => void;
  fields?: any[];
}

export const QueryInput: React.FC<QueryInputProps> = ({ onQuery, fields }) => {
  return (
    <div className="grid w-1/2 gap-4">
      <InputGroup>
        <InputGroupTextarea
          id="textarea-code-32"
          placeholder="console.log('Hello, world!');"
          className="min-h-[40px]"
        />
        <InputGroupButton size="sm" className="ml-auto" variant="default">
          Run <IconCornerDownLeft />
        </InputGroupButton>
        {/* <InputGroupAddon align="block-end" className="border-t">
         
          <InputGroupButton size="sm" className="ml-auto" variant="default">
            Run <IconCornerDownLeft />
          </InputGroupButton>
        </InputGroupAddon> */}
        {/* <InputGroupAddon align="block-start" className="border-b">
          <InputGroupText className="font-mono font-medium">
            <IconBrandFirebase stroke={1.5} />
            script.js
          </InputGroupText>
          <InputGroupButton className="ml-auto" size="icon-xs">
            <IconRefresh />
          </InputGroupButton>
          <InputGroupButton variant="ghost" size="icon-xs">
            <IconCopy />
          </InputGroupButton>
        </InputGroupAddon> */}
      </InputGroup>
    </div>
  );
};
