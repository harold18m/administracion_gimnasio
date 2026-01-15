
export interface Cliente {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  membresia: "activa" | "vencida" | "pendiente";
  tipoMembresia?: string; // ID de la membresía asignada
  nombreMembresia?: string; // Nombre de la membresía para mostrar
  fechaInicio: string;
  fechaFin: string;
  asistencias: number;
  avatarUrl?: string;
  fecha_nacimiento?: string;
  membresia_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  condicion_medica?: string;
  codigo_qr?: string;
}

export const clientesIniciales: Cliente[] = [
  {
    id: "1",
    nombre: "Carlos Mendoza",
    dni: "45678912",
    email: "carlos@example.com",
    telefono: "912345678",
    membresia: "activa",
    fechaInicio: "2023-10-01",
    fechaFin: "2023-11-01",
    asistencias: 15,
  },
  {
    id: "2",
    nombre: "María López",
    dni: "87654321",
    email: "maria@example.com",
    telefono: "987654321",
    membresia: "activa",
    fechaInicio: "2023-09-15",
    fechaFin: "2023-10-15",
    asistencias: 20,
  },
  {
    id: "3",
    nombre: "Juan Pérez",
    dni: "12345678",
    email: "juan@example.com",
    telefono: "912345678",
    membresia: "pendiente",
    fechaInicio: "2023-10-05",
    fechaFin: "2023-11-05",
    asistencias: 5,
  },
  {
    id: "4",
    nombre: "Ana García",
    dni: "98765432",
    email: "ana@example.com",
    telefono: "998765432",
    membresia: "vencida",
    fechaInicio: "2023-08-01",
    fechaFin: "2023-09-01",
    asistencias: 30,
  },
  {
    id: "5",
    nombre: "Roberto Sánchez",
    dni: "56789123",
    email: "roberto@example.com",
    telefono: "956789123",
    membresia: "activa",
    fechaInicio: "2023-09-20",
    fechaFin: "2023-10-20",
    asistencias: 12,
  },
];

export const estadoStyle = {
  activa: "bg-green-500",
  vencida: "bg-red-500",
  pendiente: "bg-yellow-500",
};
