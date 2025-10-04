
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { ClientesTable } from "@/features/clientes/ClientesTable";
import { ClienteForm } from "@/features/clientes/ClienteForm";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useClientes } from "@/features/clientes/useClientes";

export default function Clientes() {
  const {
    filteredClientes,
    busqueda,
    setBusqueda,
    isDialogOpen,
    setIsDialogOpen,
    clienteActual,
    handleEdit,
    handleDelete,
    confirmDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    onSubmit,
    handleAddNew,
    membresiasDisponibles,
    saveCliente,
  } = useClientes();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Gestión de Clientes</h2>
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <ClientesTable
        clientes={filteredClientes}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ClienteForm
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onSubmit}
        clienteActual={clienteActual}
        membresiasDisponibles={membresiasDisponibles}
        saveCliente={saveCliente}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar cliente?"
        description="Esta acción no se puede deshacer. El cliente será eliminado permanentemente del sistema."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
