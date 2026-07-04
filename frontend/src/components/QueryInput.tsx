import { useState } from "react";
import { IconCornerDownLeft } from "@tabler/icons-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";

interface QueryInputProps {
  onQuery: (clauses: string) => void;
  fields?: any[];
}

export const QueryInput: React.FC<QueryInputProps> = ({ onQuery, fields }) => {
  const [query, setQuery] = useState("");
  const handleQuery = () => {
    onQuery(query);
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQuery(e.target.value);
  };

  const handleOnBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (e.target.value.trim() === "") {
      onQuery("");
    }
  };

  return (
    <div className="grid w-1/2 gap-4">
      <InputGroup>
        <InputGroupTextarea
          id="textarea-code-32"
          placeholder="field == value AND field2 > value2"
          className="min-h-10"
          onChange={onChange}
          value={query}
          onBlur={handleOnBlur}
        />
        <InputGroupButton
          size="sm"
          className="ml-auto"
          variant="default"
          onClick={handleQuery}
        >
          Run <IconCornerDownLeft />
        </InputGroupButton>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};
