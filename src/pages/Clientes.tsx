
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { ClientesTable } from "@/features/clientes/ClientesTable";
import { ClienteForm } from "@/features/clientes/ClienteForm";
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
    onSubmit,
    handleAddNew,
  } = useClientes();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestión de Clientes</h2>
        <Button onClick={handleAddNew}>
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
      />
    </div>
  );
}
