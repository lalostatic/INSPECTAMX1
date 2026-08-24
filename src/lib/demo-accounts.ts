/**
 * INSPECTAMX — cuentas de demostración.
 * Contraseña común: Muelle2026
 * Superadmin: desarrollo@inspectamx.com  (también desarrolo@inspectamx.com)
 *
 * MODIFICAR: DEMO_ORGS para agregar patios de prueba.
 */
import type { Role } from "./catalog";

export const DEMO_PASSWORD = "Muelle2026";

export type DemoAccount = {
  local: string;
  name: string;
  role: Role;
  label: string;
};

export type DemoOrg = {
  name: string;
  legalName: string;
  rfc: string;
  depot: string;
  city: string;
  address: string;
  phone: string;
  slug: string;
  domain: string;
  inviteCode: string;
  sample: "cerlan" | "contri";
  billing: "active" | "due";
  status: "activa" | "prueba" | "vencida";
  plan: string;
  maxUsers: number;
  maxInspectors: number;
  storageMb: number;
  accounts: DemoAccount[];
};

const STAFF: DemoAccount[] = [
  { local: "admin", name: "Administrador", role: "admin", label: "Administrador" },
  { local: "oficina", name: "Oficina", role: "office", label: "Oficina" },
  { local: "inspector", name: "Inspector", role: "inspector", label: "Inspector" },
  { local: "taller", name: "Taller", role: "repair", label: "Taller M&R" },
  { local: "pintura", name: "Pintura", role: "painter", label: "Pintura" },
  { local: "supervisor", name: "Supervisor", role: "supervisor", label: "Supervisor" },
  { local: "consulta", name: "Consulta", role: "consulta", label: "Consulta" },
];

export const DEMO_ORGS: DemoOrg[] = [
  {
    name: "Cerlan",
    legalName: "Cerlan, S.A. de C.V.",
    rfc: "CER850101AB3",
    depot: "Bahía Principal",
    city: "Veracruz",
    address: "Recinto portuario, zona norte, Veracruz, Ver.",
    phone: "229 123 4500",
    slug: "cerlan",
    domain: "cerlan.mx",
    inviteCode: "CERLAN",
    sample: "cerlan",
    billing: "active",
    status: "activa",
    plan: "mensual",
    maxUsers: 25,
    maxInspectors: 10,
    storageMb: 4096,
    accounts: STAFF.map((a) =>
      a.local === "admin" ? { ...a, name: "María Solís" }
      : a.local === "inspector" ? { ...a, name: "Luis Mora" }
      : a.local === "oficina" ? { ...a, name: "Roberto Cruz" }
      : a.local === "taller" ? { ...a, name: "Elena Rivas" }
      : a.local === "pintura" ? { ...a, name: "Eduardo Peña" }
      : a.local === "supervisor" ? { ...a, name: "Karla Núñez" }
      : { ...a, name: "Iván Soto" },
    ),
  },
  {
    name: "Contri",
    legalName: "Contri Operaciones Portuarias, S.A. de C.V.",
    rfc: "COP920215XY9",
    depot: "Patio Norte",
    city: "Manzanillo",
    address: "Zona portuaria, Manzanillo, Col.",
    phone: "314 334 2100",
    slug: "contri",
    domain: "contri.mx",
    inviteCode: "CONTRI",
    sample: "contri",
    billing: "due",
    status: "vencida",
    plan: "mensual",
    maxUsers: 20,
    maxInspectors: 8,
    storageMb: 2048,
    accounts: STAFF.map((a) =>
      a.local === "admin" ? { ...a, name: "Ana Herrera" }
      : a.local === "inspector" ? { ...a, name: "Sofía Ruiz" }
      : a.local === "oficina" ? { ...a, name: "Pablo Méndez" }
      : a.local === "taller" ? { ...a, name: "Diego Lara" }
      : a.local === "pintura" ? { ...a, name: "Carmen Ortiz" }
      : a.local === "supervisor" ? { ...a, name: "Héctor Vela" }
      : { ...a, name: "Nora Díaz" },
    ),
  },
  {
    name: "Istmo Logística",
    legalName: "Istmo Logística, S.A. de C.V.",
    rfc: "ILO180330LM5",
    depot: "Patio Istmo",
    city: "Coatzacoalcos",
    address: "Corredor industrial, Coatzacoalcos, Ver.",
    phone: "921 210 8800",
    slug: "istmo",
    domain: "istmo.mx",
    inviteCode: "ISTMO",
    sample: "cerlan",
    billing: "active",
    status: "prueba",
    plan: "prueba",
    maxUsers: 10,
    maxInspectors: 4,
    storageMb: 1024,
    accounts: STAFF.map((a) =>
      a.local === "admin" ? { ...a, name: "Raúl Mendoza" }
      : a.local === "inspector" ? { ...a, name: "Patricia León" }
      : a.local === "oficina" ? { ...a, name: "Miguel Ángel Cruz" }
      : a.local === "taller" ? { ...a, name: "Brenda Salas" }
      : a.local === "pintura" ? { ...a, name: "Omar Galicia" }
      : a.local === "supervisor" ? { ...a, name: "Lucía Pineda" }
      : { ...a, name: "Tania Rocha" },
    ),
  },
];

export function demoEmail(local: string, domain: string) {
  return `${local}@${domain}`;
}
