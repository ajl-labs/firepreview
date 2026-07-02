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
          placeholder="field == value AND field2 > value2"
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
      </InputGroup>
    </div>
  );
};
