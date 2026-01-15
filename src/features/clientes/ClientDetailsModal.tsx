import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatISODate } from "@/lib/utils";
import type { Database } from "@/lib/supabase";
import { Mail, Phone, Calendar, FileText, CreditCard, User } from "lucide-react";

type ClienteRow = Database['public']['Tables']['clientes']['Row'];

interface ClientDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClienteRow | null;
}

export function ClientDetailsModal({
  isOpen,
  onOpenChange,
  cliente,
}: ClientDetailsModalProps) {
  if (!cliente) return null;

  const initials = cliente.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Información del Cliente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center justify-center space-y-3">
             <Avatar className="h-24 w-24">
              <AvatarImage src={cliente.avatar_url || ""} />
              <AvatarFallback className="text-2xl pt-1">
                 {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-bold">{cliente.nombre}</h3>
              <p className="text-sm text-muted-foreground">{cliente.dni || "Sin DNI"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 overflow-hidden text-ellipsis">{cliente.email || "No registrado"}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{cliente.telefono || "No registrado"}</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Nacimiento: {cliente.fecha_nacimiento ? formatISODate(cliente.fecha_nacimiento) : "No registrada"}
              </span>
            </div>

            {cliente.condicion_medica && (
              <div className="flex items-start space-x-3 text-sm p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900/50">
                <FileText className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <span className="font-semibold text-red-600 mb-1 block">Condición Médica</span>
                  <span className="text-red-600/90">{cliente.condicion_medica}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
