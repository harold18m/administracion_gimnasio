
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
import { Plus, Search, Pencil, UserPlus, Clipboard, Check, Building2, Globe, MapPin, CreditCard, Calendar, Smartphone, ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Tenant } from "@/types";
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

import { useToast } from "@/hooks/use-toast";

import { useNavigate } from "react-router-dom";
import { useTenant } from "@/context/TenantContext";

export default function TenantsPage() {
  const navigate = useNavigate();
  const { switchTenant } = useTenant();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      // Try to fetch tenants. This might fail if the table doesn't exist yet (migration not run)
      const { data, error } = await supabase
        .from('tenants')
        .select('*');

      if (error) {
        console.error("Error fetching tenants:", error);
        // Fallback to empty if not found
      } else {
        setTenants(data as Tenant[]);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const generateInvitation = async (tenantId: string) => {
    try {
        const { data, error } = await supabase
            .from('tenant_invitations')
            .insert([{ tenant_id: tenantId, role: 'owner' }])
            .select()
            .single();

        if (error) throw error;

        // Generate full URL
        const link = `${window.location.origin}/registro?token=${data.token}`;
        setInviteLink(link);
        setIsInviteOpen(true);
    } catch (error) {
        console.error("Error generating invitation:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo generar la invitación.",
        });
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
        navigator.clipboard.writeText(inviteLink);
        toast({
            title: "Copiado",
            description: "Enlace copiado al portapapeles.",
        });
    }
  };

  const handleCreateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const plan = formData.get('plan') as any;
    const pais = formData.get('pais') as string;
    const ciudad = formData.get('ciudad') as string;
    const telefono = formData.get('telefono') as string;
    const plan_expires_at = formData.get('plan_expires_at') as string;

    try {
        const { error } = await supabase.from('tenants').insert([{ 
            name, 
            slug, 
            plan,
            pais,
            ciudad,
            telefono,
            plan_expires_at
        }]);
        if (error) throw error;
        
        // Refresh list
        fetchTenants();
        setOpen(false); // Close dialog
        toast({ title: "Éxito", description: "Gimnasio creado correctamente." });
    } catch (error) {
        console.error("Error creating tenant:", error);
        toast({ variant: "destructive", title: "Error", description: "Error al crear el gimnasio" });
    }
  };

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const handleUpdateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTenant) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const plan = formData.get('plan') as any;
    const pais = formData.get('pais') as string;
    const ciudad = formData.get('ciudad') as string;
    const telefono = formData.get('telefono') as string;
    const plan_expires_at = formData.get('plan_expires_at') as string;

    try {
        const { error } = await supabase
            .from('tenants')
            .update({ name, slug, plan, pais, ciudad, telefono, plan_expires_at })
            .eq('id', editingTenant.id);

        if (error) throw error;
        
        fetchTenants();
        setOpen(false);
        setEditingTenant(null);
        toast({ title: "Actualizado", description: "Datos del gimnasio actualizados." });
    } catch (error) {
        console.error("Error updating tenant:", error);
        toast({ variant: "destructive", title: "Error", description: "Error al actualizar." });
    }
  };

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');

  const calculateExpiryDate = (months: number) => {
      const date = new Date();
      date.setMonth(date.getMonth() + Number(months));
      return date.toISOString().split('T')[0];
  };

  const openEdit = (tenant: Tenant) => {
      setEditingTenant(tenant);
      setStep(1);
      // For editing, we don't necessarily reset duration to 1, but we rely on existing date
      setExpiryDate(tenant.plan_expires_at ? new Date(tenant.plan_expires_at).toISOString().split('T')[0] : '');
      setDuration(1); // Default reset
      setOpen(true);
  };

  const openNew = () => {
      setEditingTenant(null);
      setStep(1);
      setDuration(1);
      setExpiryDate(calculateExpiryDate(1));
      setOpen(true);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const months = parseInt(e.target.value);
      setDuration(months);
      if (!isNaN(months) && months > 0) {
          setExpiryDate(calculateExpiryDate(months));
      }
  };

  const nextStep = (e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      
      // Validate only Step 1 fields
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const slugInput = document.getElementById('slug') as HTMLInputElement;
      
      if (nameInput && !nameInput.checkValidity()) {
          nameInput.reportValidity();
          return;
      }
      
      if (slugInput && !slugInput.checkValidity()) {
          slugInput.reportValidity();
          return;
      }

      setStep(2);
  };

  const [suspendDialog, setSuspendDialog] = useState<{open: boolean, tenant: Tenant | null, action: 'enable' | 'disable'}>({ open: false, tenant: null, action: 'disable' });
  const [confirmationText, setConfirmationText] = useState('');

  const openSuspendDialog = (tenant: Tenant) => {
      const action = tenant.status === 'suspended' ? 'enable' : 'disable';
      setSuspendDialog({ open: true, tenant, action });
      setConfirmationText('');
  };

  const handleToggleStatus = async () => {
      if (!suspendDialog.tenant) return;
      const { tenant, action } = suspendDialog;
      
      const expectedText = action === 'enable' ? 'habilitar' : 'deshabilitar';
      if (confirmationText.toLowerCase() !== expectedText) {
          toast({ variant: "destructive", title: "Error", description: `Debes escribir "${expectedText}" para confirmar.` });
          return;
      }

      try {
          const newStatus = action === 'enable' ? 'active' : 'suspended';
          const { error } = await supabase
              .from('tenants')
              .update({ status: newStatus })
              .eq('id', tenant.id);

          if (error) throw error;

          fetchTenants();
          setSuspendDialog({ open: false, tenant: null, action: 'disable' });
          toast({ title: "Éxito", description: `Gimnasio ${action === 'enable' ? 'habilitado' : 'deshabilitado'} correctamente.` });
      } catch (error) {
          console.error("Error updating status:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado." });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gimnasios</h2>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button onClick={openNew}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Gimnasio
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-center mb-2">
                        {editingTenant ? "Editar Gimnasio" : "Registrar Nuevo Gimnasio"}
                    </DialogTitle>
                    
                    {/* Visual Stepper */}
                    <div className="flex items-center justify-center space-x-4 mb-4">
                        <div className={`flex flex-col items-center space-y-1 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`p-2 rounded-full border-2 ${step === 1 ? 'border-primary bg-primary/10' : 'border-muted bg-muted/20'}`}>
                                <Building2 className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium">Info</span>
                        </div>
                        <div className={`h-[2px] w-12 ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`flex flex-col items-center space-y-1 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`p-2 rounded-full border-2 ${step === 2 ? 'border-primary bg-primary/10' : 'border-muted bg-muted/20'}`}>
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-medium">Plan</span>
                        </div>
                    </div>

                    <DialogDescription className="text-center">
                        {step === 1 ? "Completa la información esencial del gimnasio." : "Define el plan de suscripción y su vigencia."}
                    </DialogDescription>
                </DialogHeader>
                
                <form 
                    onSubmit={editingTenant ? handleUpdateTenant : handleCreateTenant} 
                    className="space-y-6 tenant-form"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && step === 1) {
                            e.preventDefault();
                        }
                    }}
                >
                    
                    {/* STEP 1: INFORMACIÓN BÁSICA */}
                    <div className={step === 1 ? "space-y-4 animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Nombre del Gimnasio</Label>
                            <Input 
                                id="name" 
                                name="name" 
                                placeholder="Ej. FitGym Central" 
                                defaultValue={editingTenant?.name}
                                required 
                                className="pl-9"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug" className="flex items-center gap-2"><Globe className="h-4 w-4" /> URL Personalizada (Slug)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">gym.com/</span>
                                <Input 
                                    id="slug" 
                                    name="slug" 
                                    placeholder="fitgym-central" 
                                    defaultValue={editingTenant?.slug}
                                    required 
                                    className="pl-20"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pais" className="flex items-center gap-2"><Globe className="h-4 w-4" /> País</Label>
                                <Input 
                                    id="pais" 
                                    name="pais" 
                                    placeholder="Perú" 
                                    defaultValue={editingTenant?.pais}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ciudad" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Ciudad</Label>
                                <Input 
                                    id="ciudad" 
                                    name="ciudad" 
                                    placeholder="Lima" 
                                    defaultValue={editingTenant?.ciudad}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telefono" className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Contacto</Label>
                            <Input 
                                id="telefono" 
                                name="telefono" 
                                placeholder="+51 999 888 777" 
                                defaultValue={editingTenant?.telefono}
                            />
                        </div>
                    </div>

                    {/* STEP 2: PLAN Y SUSCRIPCIÓN */}
                    <div className={step === 2 ? "space-y-4 animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                        <div className="space-y-2">
                            <Label htmlFor="plan" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Plan de Suscripción</Label>
                            <Select name="plan" required defaultValue={editingTenant?.plan || "basic"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="basic">⭐ Básico</SelectItem>
                                    <SelectItem value="premium">🚀 Premium</SelectItem>
                                    <SelectItem value="enterprise">🏢 Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Duración (Meses)</Label>
                            <Input 
                                type="number" 
                                id="duration" 
                                min="1"
                                max="100"
                                value={duration}
                                onChange={handleDurationChange}
                                placeholder="Ej. 1" 
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Se sumará a la fecha actual.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="plan_expires_at" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Vencimiento del Plan</Label>
                            <Input 
                                type="date" 
                                id="plan_expires_at" 
                                name="plan_expires_at" 
                                required
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                            />
                            <p className="text-[0.8rem] text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" /> El servicio se suspenderá automáticamente tras esta fecha.
                            </p>
                        </div>
                        
                        <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-primary/20">
                            <h4 className="text-sm font-medium text-primary mb-1">Resumen</h4>
                            <p className="text-xs text-muted-foreground">
                                Estás asignando el plan seleccionado por <strong>{duration} mes(es)</strong>.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between items-center w-full pt-4 border-t">
                        {step === 2 ? (
                            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Atrás
                            </Button>
                        ) : <div />}
                        
                        {step === 1 ? (
                            <Button type="button" onClick={nextStep} className="gap-2">
                                Siguiente <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                                {editingTenant ? "Guardar Cambios" : "Crear Gimnasio"}
                                <Check className="h-4 w-4" />
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar gimnasio..." className="pl-8" />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug (URL)</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell>
                </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay gimnasios registrados.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.id} className={tenant.status === 'suspended' ? 'bg-muted/50 opacity-70' : ''}>
                  <TableCell className="font-medium">
                      {tenant.name}
                      {tenant.status === 'suspended' && <span className="ml-2 text-xs text-red-500 font-bold">(Suspendido)</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{tenant.slug}</span>
                        {tenant.ciudad && <span className="text-xs text-muted-foreground">{tenant.ciudad}, {tenant.pais}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="capitalize w-fit">
                            {tenant.plan}
                        </Badge>
                        {tenant.plan_expires_at && (
                            <span className={`text-xs ${new Date(tenant.plan_expires_at) < new Date() ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                Vence: {new Date(tenant.plan_expires_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={tenant.status === 'suspended' ? "bg-red-500" : "bg-green-500 hover:bg-green-600"}>
                        {tenant.status === 'suspended' ? 'Suspendido' : 'Activo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={tenant.status === 'suspended' ? "text-green-600 border-green-200 hover:bg-green-50" : "text-red-600 border-red-200 hover:bg-red-50"}
                            onClick={() => openSuspendDialog(tenant)}
                        >
                            {tenant.status === 'suspended' ? 'Habilitar' : 'Suspender'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => generateInvitation(tenant.id)}>
                            <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(tenant)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={async () => {
                            await switchTenant(tenant.id);
                            navigate("/");
                        }}>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Invitación Generada</DialogTitle>
                <DialogDescription>
                    Comparte este enlace con el dueño del gimnasio para que complete su registro.
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 mt-4">
                <Input value={inviteLink || ''} readOnly />
                <Button size="icon" onClick={copyToClipboard}>
                    <Clipboard className="h-4 w-4" />
                </Button>
            </div>
            <DialogFooter className="mt-4">
                <Button onClick={() => setIsInviteOpen(false)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Suspend Confirmation Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => !open && setSuspendDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className={suspendDialog.action === 'enable' ? "text-green-600" : "text-destructive"}>
                    {suspendDialog.action === 'enable' ? "Habilitar Gimnasio" : "Suspender Gimnasio"}
                </DialogTitle>
                <DialogDescription>
                    Esta acción {suspendDialog.action === 'enable' ? "permitirá" : "bloqueará"} el acceso al sistema para <strong>{suspendDialog.tenant?.name}</strong>.
                    <br/><br/>
                    Para confirmar, escribe <strong>{suspendDialog.action === 'enable' ? "habilitar" : "deshabilitar"}</strong> abajo.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Input 
                    placeholder={suspendDialog.action === 'enable' ? "habilitar" : "deshabilitar"}
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="border-primary"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setSuspendDialog(prev => ({ ...prev, open: false }))}>Cancelar</Button>
                <Button 
                    variant={suspendDialog.action === 'enable' ? "default" : "destructive"}
                    onClick={handleToggleStatus}
                    disabled={confirmationText.toLowerCase() !== (suspendDialog.action === 'enable' ? 'habilitar' : 'deshabilitar')}
                >
                    Confirmar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
