"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { TagBadge } from "./tag-badge";
import { Plus } from "lucide-react";

interface TagInputProps {
  workspaceId: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({
  workspaceId,
  value = [],
  onChange,
  placeholder = "Add tags (press Enter)...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [availableTags, setAvailableTags] = useState<Array<{ name: string; colorToken: string }>>([]);

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/workspaces/${workspaceId}/tags`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setAvailableTags(json.data);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  function addTag(rawTag: string) {
    const trimmed = rawTag.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (!value.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  }

  function removeTag(tagToRemove: string) {
    onChange(value.filter((t) => t !== tagToRemove));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  const unusedSuggestions = availableTags
    .filter((t) => !value.some((v) => v.toLowerCase() === t.name.toLowerCase()))
    .slice(0, 6);

  return (
    <div className="space-y-2">
      <div className="min-h-[42px] p-1.5 rounded-xl border border-input bg-background/50 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all flex flex-wrap items-center gap-1.5">
        {value.map((tag) => {
          const match = availableTags.find((t) => t.name.toLowerCase() === tag.toLowerCase());
          return (
            <TagBadge
              key={tag}
              name={tag}
              colorToken={match?.colorToken || "slate"}
              onRemove={() => removeTag(tag)}
            />
          );
        })}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue);
            }
          }}
          placeholder={value.length === 0 ? placeholder : "Add more..."}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden px-1.5 py-1"
        />
      </div>

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
          <span className="font-medium">Suggestions:</span>
          {unusedSuggestions.map((tag) => (
            <button
              key={tag.name}
              type="button"
              onClick={() => addTag(tag.name)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/50 hover:bg-secondary text-secondary-foreground text-xs transition-colors"
            >
              <Plus className="w-3 h-3 text-muted-foreground" />
              <span>#{tag.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
