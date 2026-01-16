import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientSimple {
  id: string;
  nombre: string;
}

interface ClientComboboxProps {
  value: string | null | undefined;
  options: ClientSimple[];
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function ClientCombobox({
  value,
  options,
  onChange,
  placeholder = "Seleccionar cliente...",
  className
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  
  // Handle "none" or null/undefined as empty selection
  const safeValue = value === "none" ? null : value;
  const selected = options.find(o => o.id === safeValue);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open}
            className={cn("justify-between w-full h-9 text-sm font-normal", !selected && "text-muted-foreground", className)}
        >
          <span className="truncate">{selected?.nombre || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[280px]" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandEmpty>No se encontró el cliente.</CommandEmpty>
          <CommandList>
            <CommandGroup>
               {/* Option to clear selection */}
               <CommandItem
                  value="__none__" // Special value for filtering
                  onSelect={() => {
                    onChange("none");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !safeValue ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Sin asignar
                </CommandItem>
              {options.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.nombre}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      safeValue === c.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {c.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
