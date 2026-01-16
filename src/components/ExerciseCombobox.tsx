import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface EjercicioShort {
  id: string;
  nombre: string;
}

interface ExerciseComboboxProps {
  value: string | null | undefined;
  options: EjercicioShort[];
  onChange: (v: string) => void;
}

export function ExerciseCombobox({
  value,
  options,
  onChange,
}: ExerciseComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  const label = selected?.nombre || "Seleccionar ejercicio";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="justify-between w-full h-9 text-sm">
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[280px]" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Buscar ejercicio..." />
          <CommandEmpty>Sin resultados</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((e) => (
                <CommandItem
                  key={e.id}
                  value={e.nombre}
                  onSelect={() => {
                    onChange(e.id);
                    setOpen(false);
                  }}
                >
                  {e.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
