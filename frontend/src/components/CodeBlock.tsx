import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

SyntaxHighlighter.registerLanguage("json", json);

interface CodeBlockProps {
  value: unknown;
  className?: string;
}

export function CodeBlock({ value, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const formatted = JSON.stringify(value, null, 2);

  async function handleCopy() {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn("relative rounded-md border overflow-hidden", className)}
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={handleCopy}
        className="absolute top-2 right-2 h-6 w-6 z-10"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
      <SyntaxHighlighter
        language="json"
        style={atomOneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.8rem",
          padding: "1rem",
        }}
      >
        {formatted}
      </SyntaxHighlighter>
    </div>
  );
}
