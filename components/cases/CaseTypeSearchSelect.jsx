import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const normalizeValue = (value = "") =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export default function CaseTypeSearchSelect({
  id,
  value,
  options = [],
  onValueChange,
  placeholder = "Search or type case type",
  disabled = false,
  className = "",
  helperText = "Type to search available case types, or enter a custom case type manually.",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const normalizedInput = normalizeValue(value);
  const filteredOptions = useMemo(() => {
    if (!normalizedInput) return options;

    return options.filter((option) => {
      const normalizedName = normalizeValue(option.name);
      const normalizedCode = normalizeValue(option.code);
      return (
        normalizedName.includes(normalizedInput) ||
        normalizedCode.includes(normalizedInput)
      );
    });
  }, [options, normalizedInput]);

  const hasExactMatch = filteredOptions.some(
    (option) =>
      normalizeValue(option.name) === normalizedInput ||
      normalizeValue(option.code) === normalizedInput
  );

  const showUseTypedValue = normalizedInput && !hasExactMatch;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
        />
        {open && !disabled ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md">
          <Command shouldFilter={false}>
            <CommandList>
              <CommandEmpty>No matching case types found.</CommandEmpty>
              <CommandGroup>
                {showUseTypedValue ? (
                  <CommandItem
                    value={value}
                    onSelect={() => {
                      onValueChange(value);
                      setOpen(false);
                    }}
                  >
                    <Check className="h-4 w-4 opacity-0" />
                    <span>Use "{value}"</span>
                  </CommandItem>
                ) : null}
                {filteredOptions.map((option) => {
                  const isSelected =
                    normalizeValue(option.name) === normalizedInput ||
                    normalizeValue(option.code) === normalizedInput;

                  return (
                    <CommandItem
                      key={`${option.code || option.name}-${option.name}`}
                      value={`${option.name} ${option.code || ""}`}
                      onSelect={() => {
                        onValueChange(option.name);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      <span>{option.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          </div>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{helperText}</p>
    </div>
  );
}
