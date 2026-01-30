
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Phone, User, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { CrmLead } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
    new: "Nuevo",
    contacted: "Contactado",
    demo_scheduled: "Demo Agendada",
    negotiation: "Negociación",
    won: "Ganado (Cliente)",
    lost: "Perdido"
};

const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-500",
    contacted: "bg-yellow-500",
    demo_scheduled: "bg-purple-500",
    negotiation: "bg-orange-500",
    won: "bg-green-500",
    lost: "bg-red-500"
};

export default function CrmLeadsPage() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los prospectos" });
    } else {
        setLeads(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      const payload = {
          admin_name: formData.get('admin_name'),
          role: formData.get('role'),
          phone: formData.get('phone'),
          email: formData.get('email'),
          pais: formData.get('pais'),
          ciudad: formData.get('ciudad'),
          status: formData.get('status'),
          interest_level: formData.get('interest_level'),
          notes: formData.get('notes'),
          gym_profile: {
              members_count: parseInt(formData.get('members_count') as string || '0'),
              current_system: formData.get('current_system'),
              locations_count: parseInt(formData.get('locations_count') as string || '1'),
              avg_ticket: parseFloat(formData.get('avg_ticket') as string || '0')
          }
      };

      try {
          if (editingLead) {
              const { error } = await supabase
                  .from('crm_leads')
                  .update(payload)
                  .eq('id', editingLead.id);
              if (error) throw error;
              toast({ title: "Actualizado", description: "Prospecto actualizado correctamente" });
          } else {
              const { error } = await supabase
                  .from('crm_leads')
                  .insert([payload]);
              if (error) throw error;
              toast({ title: "Creado", description: "Prospecto registrado correctamente" });
          }
          
          setIsDialogOpen(false);
          setEditingLead(null);
          fetchLeads();
      } catch (err) {
          console.error(err);
          toast({ variant: "destructive", title: "Error", description: "Error al guardar prospecto" });
      }
  };

  const handleEdit = (lead: CrmLead) => {
      setEditingLead(lead);
      setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
      if (!confirm("¿Estás seguro de eliminar este prospecto?")) return;
      const { error } = await supabase.from('crm_leads').delete().eq('id', id);
      if (error) {
           toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar" });
      } else {
           toast({ title: "Eliminado", description: "Prospecto eliminado" });
           fetchLeads();
      }
  };

  const openNew = () => {
      setEditingLead(null);
      setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">CRM / Prospectos</h2>
        <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Prospecto
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contacto</TableHead>
              <TableHead>Perfil Gimnasio</TableHead>
              <TableHead>Interés</TableHead>
              <TableHead>Estado (Embudo)</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : leads.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay prospectos registrados.</TableCell></TableRow>
            ) : (
                leads.map((lead) => (
                    <TableRow key={lead.id}>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                <div className="font-medium flex items-center gap-2">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    {lead.admin_name}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Building2 className="h-3 w-3" />
                                    {lead.role}
                                </div>
                                {(lead.ciudad || lead.pais) && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span className="text-[10px]">📍</span>
                                        {lead.ciudad}{lead.ciudad && lead.pais ? ', ' : ''}{lead.pais}
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    {lead.phone}
                                </div>
                                {lead.email && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span className="text-[10px]">📧</span>
                                        {lead.email}
                                    </div>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm space-y-1">
                                <div><span className="font-semibold">{lead.gym_profile.members_count}</span> Socios</div>
                                <div className="text-xs text-muted-foreground">Sistema: {lead.gym_profile.current_system || 'Ninguno'}</div>
                                <div className="text-xs text-muted-foreground">{lead.gym_profile.locations_count} Sede(s)</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={
                                lead.interest_level === 'high' ? 'text-green-600 border-green-600' :
                                lead.interest_level === 'low' ? 'text-gray-500 border-gray-500' :
                                'text-yellow-600 border-yellow-600'
                            }>
                                {lead.interest_level === 'high' ? 'Alto' : lead.interest_level === 'low' ? 'Bajo' : 'Medio'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge className={`${STATUS_COLORS[lead.status] || 'bg-gray-500'} hover:bg-opacity-80`}>
                                {STATUS_LABELS[lead.status] || lead.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                            {lead.notes}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(lead)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(lead.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>{editingLead ? "Editar Prospecto" : "Nuevo Prospecto"}</DialogTitle>
                  <DialogDescription>Registra la información del dueño y el gimnasio potencial.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-2 gap-6">
                      {/* Columna Izquierda: Contacto */}
                      <div className="space-y-4">
                          <h4 className="font-medium text-sm text-primary">Datos del Contacto</h4>
                          <div className="space-y-2">
                              <Label htmlFor="admin_name">Nombre Completo</Label>
                              <Input id="admin_name" name="admin_name" required defaultValue={editingLead?.admin_name} placeholder="Juan Pérez" />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="role">Cargo</Label>
                              <Input id="role" name="role" defaultValue={editingLead?.role} placeholder="Dueño, Administrador..." />
                          </div>

                          <div className="space-y-2">
                              <Label htmlFor="phone">Celular / WhatsApp</Label>
                              <Input id="phone" name="phone" defaultValue={editingLead?.phone} placeholder="+51 999..." />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="email">Correo Electrónico</Label>
                              <Input type="email" id="email" name="email" defaultValue={editingLead?.email} placeholder="cliente@example.com" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Estado del Embudo</Label>
                                <Select name="status" defaultValue={editingLead?.status || "new"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">Nuevo</SelectItem>
                                        <SelectItem value="contacted">Contactado</SelectItem>
                                        <SelectItem value="demo_scheduled">Demo Agendada</SelectItem>
                                        <SelectItem value="negotiation">Negociación</SelectItem>
                                        <SelectItem value="won">Ganado</SelectItem>
                                        <SelectItem value="lost">Perdido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interest_level">Interés</Label>
                                <Select name="interest_level" defaultValue={editingLead?.interest_level || "medium"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Nivel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Bajo</SelectItem>
                                        <SelectItem value="medium">Medio</SelectItem>
                                        <SelectItem value="high">Alto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="pais">País</Label>
                                  <Input id="pais" name="pais" defaultValue={editingLead?.pais} placeholder="Perú" />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="ciudad">Ciudad</Label>
                                  <Input id="ciudad" name="ciudad" defaultValue={editingLead?.ciudad} placeholder="Lima" />
                              </div>
                          </div>
                      </div>

                      {/* Columna Derecha: Perfil Gimnasio */}
                      <div className="space-y-4">
                          <h4 className="font-medium text-sm text-primary">Perfil del Gimnasio</h4>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                  <Label htmlFor="members_count">Cantidad Socios</Label>
                                  <Input type="number" id="members_count" name="members_count" defaultValue={editingLead?.gym_profile?.members_count} placeholder="0" />
                             </div>
                             <div className="space-y-2">
                                  <Label htmlFor="avg_ticket">Ticket Promedio</Label>
                                  <Input type="number" step="0.01" id="avg_ticket" name="avg_ticket" defaultValue={editingLead?.gym_profile?.avg_ticket} placeholder="0.00" />
                             </div>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="current_system">Sistema Actual</Label>
                              <Input id="current_system" name="current_system" defaultValue={editingLead?.gym_profile?.current_system} placeholder="Excel, No tiene..." />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="locations_count">Número de Sedes</Label>
                              <Input type="number" id="locations_count" name="locations_count" defaultValue={editingLead?.gym_profile?.locations_count || 1} />
                          </div>
                          
                          <div className="space-y-2">
                              <Label htmlFor="notes">Notas Adicionales</Label>
                              <Textarea id="notes" name="notes" defaultValue={editingLead?.notes} placeholder="Detalles de la conversación..." />
                          </div>
                      </div>
                  </div>

                  <DialogFooter>
                      <Button type="submit">{editingLead ? "Guardar Cambios" : "Crear Prospecto"}</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
