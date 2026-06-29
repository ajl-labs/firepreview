import { useState } from "react";
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
  onQuery: (clauses: string) => void;
  fields?: any[];
}

export const QueryInput: React.FC<QueryInputProps> = ({ onQuery, fields }) => {
  const [query, setQuery] = useState("");

  const handleQuery = () => {
    // Parse the query string into clauses (this is a placeholder)

    onQuery(query);
  };

  return (
    <div className="grid w-1/2 gap-4">
      <InputGroup>
        <InputGroupTextarea
          id="textarea-code-32"
          placeholder="console.log('Hello, world!');"
          className="min-h-[40px]"
          onChange={(e) => setQuery(e.target.value)}
          value={query}
        />
        <InputGroupButton
          size="sm"
          className="ml-auto"
          variant="default"
          onClick={handleQuery}
        >
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
