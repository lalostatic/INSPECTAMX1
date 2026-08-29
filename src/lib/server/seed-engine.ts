/**
 * Semilla del motor de plantillas. Idempotente: si ya hay plantillas, no duplica.
 */
import { DEFAULT_STATUSES, INCIDENT_KINDS } from "@/lib/engine-catalog";
import { getSql } from "@/lib/db";
import { ensureOrgTenant, tenantTables } from "@/lib/server/tenant-schema";

type FieldSeed = {
  type: string;
  label: string;
  required?: boolean;
  options?: string;
  weight?: number;
  help?: string;
};

async function addStatuses(sql: Awaited<ReturnType<typeof getSql>>, table: string, templateId: string) {
  let i = 0;
  for (const s of DEFAULT_STATUSES) {
    await sql.query(
      `insert into ${table} (id, template_id, key, label, color, sort_order, is_initial, is_final)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [crypto.randomUUID(), templateId, s.key, s.label, s.color, i, Boolean(s.initial), Boolean(s.final)],
    );
    i += 1;
  }
}

async function addFields(
  sql: Awaited<ReturnType<typeof getSql>>,
  table: string,
  templateId: string,
  fields: FieldSeed[],
) {
  let i = 0;
  for (const f of fields) {
    await sql.query(
      `insert into ${table} (id, template_id, sort_order, type, label, required, options, weight, help)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        crypto.randomUUID(),
        templateId,
        i,
        f.type,
        f.label,
        Boolean(f.required),
        f.options ?? "",
        f.weight ?? 0,
        f.help ?? "",
      ],
    );
    i += 1;
  }
}

async function addTemplate(
  sql: Awaited<ReturnType<typeof getSql>>,
  T: ReturnType<typeof tenantTables>,
  opts: { name: string; description: string; category: string; kind: string; fields: FieldSeed[] },
) {
  const id = crypto.randomUUID();
  await sql.query(
    `insert into ${T.templates} (id, name, description, category, kind, scoring_enabled)
     values ($1,$2,$3,$4,$5,$6)`,
    [id, opts.name, opts.description, opts.category, opts.kind, opts.kind !== "container_map" && opts.kind !== "chassis_map"],
  );
  await addStatuses(sql, T.template_statuses, id);
  await addFields(sql, T.template_fields, id, opts.fields);
  return id;
}

export async function seedEngine(orgId: string, pack: "cerlan" | "contri" | "istmo", inspectorId: string, inspectorName: string) {
  const schema = await ensureOrgTenant(orgId);
  const sql = await getSql();
  const T = tenantTables(schema);
  const [n] = await sql.query<{ c: number }>(`select count(*)::int as c from ${T.templates}`);
  if ((n?.c ?? 0) > 0) return;

  const [b1] = await sql.query<{ id: string }>(
    `insert into ${T.branches} (id, name, city, address) values ($1,$2,$3,$4) returning id`,
    [crypto.randomUUID(), pack === "istmo" ? "Almacén Istmo" : pack === "contri" ? "Patio Norte" : "Bahía Principal", pack === "istmo" ? "Coatzacoalcos" : pack === "contri" ? "Manzanillo" : "Veracruz", ""],
  );
  await sql.query(`insert into ${T.branches} (id, name, city) values ($1,$2,$3)`, [
    crypto.randomUUID(),
    pack === "istmo" ? "Andén Sur" : "Stack B",
    pack === "istmo" ? "Coatzacoalcos" : pack === "contri" ? "Manzanillo" : "Veracruz",
  ]);

  for (const name of INCIDENT_KINDS) {
    const sev = name === "Riesgo" || name === "Incumplimiento" ? "alta" : name === "Observación" ? "baja" : "media";
    await sql.query(`insert into ${T.incident_types} (id, name, severity) values ($1,$2,$3)`, [
      crypto.randomUUID(),
      name,
      sev,
    ]);
  }

  await sql.query(
    `insert into ${T.automations} (id, name, when_event, then_action) values
     ($1,'Incidencia crítica → tarea',$2,$3),
     ($4,'Rechazo → corrección',$5,$6),
     ($7,'Score bajo → aviso supervisor',$8,$9)`,
    [
      crypto.randomUUID(),
      "incidencia_critica",
      "crear_tarea",
      crypto.randomUUID(),
      "rechazada",
      "crear_tarea",
      crypto.randomUUID(),
      "score_critico",
      "notificar_supervisor",
    ],
  );

  await sql.query(`insert into ${T.dashboard_prefs} (id, widgets) values ('default', $1) on conflict (id) do nothing`, [
    "inspecciones,incidencias,estados,tareas,score,vivos",
  ]);

  const containerId = await addTemplate(sql, T, {
    name: "Inspección de contenedor",
    description: "Mapa de unidad, puertas, interior y laterales. El daño es opcional.",
    category: "Contenedor",
    kind: "container_map",
    fields: [],
  });

  await addTemplate(sql, T, {
    name: "Estado de chasis",
    description: "Mapa de puntos sobre plano técnico: elevación, planta, frente y trasera.",
    category: "Chasis",
    kind: "chassis_map",
    fields: [],
  });

  let formId = containerId;

  if (pack === "cerlan") {
    formId = await addTemplate(sql, T, {
      name: "Auditoría de seguridad",
      description: "EPP, señalización y riesgos en patio.",
      category: "Seguridad",
      kind: "form",
      fields: [
        { type: "select", label: "Área", required: true, options: "Bahía|Stack|Taller|Gate" },
        { type: "checkbox", label: "EPP completo", required: true, weight: 25 },
        { type: "select", label: "Señalización", required: true, options: "Bueno|Regular|Malo", weight: 20 },
        { type: "select", label: "Orden y limpieza", options: "Bueno|Regular|Malo", weight: 20 },
        { type: "select", label: "Extintores vigentes", options: "Sí|No", weight: 20 },
        { type: "textarea", label: "Observaciones" },
        { type: "photo", label: "Evidencia fotográfica", required: true },
        { type: "signature", label: "Firma del auditor", required: true },
        { type: "gps", label: "Ubicación" },
      ],
    });
    await sql.query(`insert into ${T.assets} (id, branch_id, code, kind, name) values ($1,$2,$3,$4,$5)`, [
      crypto.randomUUID(),
      b1?.id ?? "",
      "HAMU2333567",
      "contenedor",
      "40HC Hapag-Lloyd",
    ]);
  } else if (pack === "contri") {
    formId = await addTemplate(sql, T, {
      name: "Inspección de vehículo",
      description: "Unidad de patio: luces, frenos, llantas y documentos.",
      category: "Vehículo",
      kind: "form",
      fields: [
        { type: "text", label: "Placas", required: true },
        { type: "number", label: "Kilometraje", required: true },
        { type: "select", label: "Tipo de vehículo", required: true, options: "Tractocamión|Montacargas|Pickup|Patín" },
        { type: "select", label: "Luces", required: true, options: "OK|Falla", weight: 20 },
        { type: "select", label: "Frenos", required: true, options: "OK|Falla", weight: 25 },
        { type: "select", label: "Llantas", options: "OK|Falla", weight: 20 },
        { type: "checkbox", label: "Extintor a bordo", weight: 15 },
        { type: "photo", label: "Foto de unidad", required: true },
        { type: "signature", label: "Firma del operador", required: true },
        { type: "gps", label: "Ubicación" },
      ],
    });
    await sql.query(`insert into ${T.assets} (id, branch_id, code, kind, name) values ($1,$2,$3,$4,$5)`, [
      crypto.randomUUID(),
      b1?.id ?? "",
      "MX-12-AB-34",
      "vehiculo",
      "Tractocamión 01",
    ]);
  } else {
    formId = await addTemplate(sql, T, {
      name: "Inspección de almacén",
      description: "5S, estiba y equipo contra incendio.",
      category: "Almacén",
      kind: "form",
      fields: [
        { type: "select", label: "Zona", required: true, options: "Recepción|Rack A|Rack B|Despacho" },
        { type: "select", label: "Limpieza (5S)", required: true, options: "Bueno|Regular|Malo", weight: 25 },
        { type: "select", label: "Estiba correcta", options: "Sí|No", weight: 20 },
        { type: "select", label: "Pasillos libres", options: "Sí|No", weight: 20 },
        { type: "checkbox", label: "Equipo contra incendio vigente", weight: 20 },
        { type: "textarea", label: "Hallazgos" },
        { type: "photo", label: "Evidencia", required: true },
        { type: "signature", label: "Firma", required: true },
        { type: "gps", label: "Ubicación" },
      ],
    });
    await sql.query(`insert into ${T.assets} (id, branch_id, code, kind, name) values ($1,$2,$3,$4,$5)`, [
      crypto.randomUUID(),
      b1?.id ?? "",
      "ALM-A",
      "almacen",
      "Nave principal",
    ]);
  }

  const fields = await sql.query<{ id: string; type: string; weight: number; label: string }>(
    `select id, type, weight, label from ${T.template_fields} where template_id = $1 order by sort_order`,
    [formId],
  );
  const [maxF] = await sql.query<{ n: number }>(`select coalesce(max(folio),0)::int as n from ${T.records}`);
  const recId = crypto.randomUUID();
  const folio = (maxF?.n ?? 0) + 1;
  await sql.query(
    `insert into ${T.records} (id, folio, template_id, user_id, inspector_name, status, score, score_label, tags, lat, lng, submitted_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())`,
    [recId, folio, formId, inspectorId, inspectorName, "en_proceso", 85, "Bueno", "calidad,revision", 19.2, -96.13],
  );
  for (const f of fields) {
    let value = "OK";
    if (f.type === "checkbox") value = "sí";
    if (f.type === "select") {
      if (f.label === "Área") value = "Bahía";
      else if (f.label === "Zona") value = "Recepción";
      else if (f.label.includes("Tipo")) value = "Tractocamión";
      else if (f.label.includes("Limpieza") || f.label.includes("Señal") || f.label.includes("Orden") || f.label.includes("Estiba") || f.label.includes("Pasillos")) value = "Bueno";
      else if (f.label.includes("Luces") || f.label.includes("Frenos") || f.label.includes("Llantas")) value = "OK";
      else if (f.label.includes("Extintores")) value = "Sí";
    }
    if (f.type === "text") value = "MX-12-AB-34";
    if (f.type === "number") value = "148230";
    if (f.type === "textarea") value = "Levantamiento de demostración.";
    if (f.type === "photo" || f.type === "signature" || f.type === "gps") value = "capturado";
    await sql.query(`insert into ${T.record_answers} (id, record_id, field_id, value) values ($1,$2,$3,$4)`, [
      crypto.randomUUID(),
      recId,
      f.id,
      value,
    ]);
  }
  await sql.query(
    `insert into ${T.record_incidents} (id, record_id, type_name, severity, title, notes)
     values ($1,$2,$3,$4,$5,$6)`,
    [crypto.randomUUID(), recId, "Observación", "baja", "Pasillo con material suelto", "Se señaló al personal de almacén."],
  );
  await sql.query(`insert into ${T.record_events} (id, record_id, actor, kind, message) values ($1,$2,$3,$4,$5)`, [
    crypto.randomUUID(),
    recId,
    inspectorName,
    "alta",
    "Inspección de demostración",
  ]);
  await sql.query(
    `insert into ${T.assignments} (id, template_id, record_id, title, assigned_to, assigned_name, location_name, priority, status, due_at, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now() + interval '1 day', $10)`,
    [
      crypto.randomUUID(),
      formId,
      recId,
      pack === "contri" ? "Inspección de tractocamión 01" : pack === "istmo" ? "Recorrido 5S naves" : "Auditoría de bahía",
      inspectorId,
      inspectorName,
      pack === "istmo" ? "Almacén Istmo" : "Patio",
      "alta",
      "abierta",
      inspectorId,
    ],
  );
}

/** Idempotente: agrega plantilla chassis_map si el patio ya tenía semilla vieja. */
export async function ensureChassisTemplate(orgId: string) {
  const schema = await ensureOrgTenant(orgId);
  const sql = await getSql();
  const T = tenantTables(schema);
  const [n] = await sql.query<{ c: number }>(
    `select count(*)::int as c from ${T.templates} where kind = 'chassis_map'`,
  );
  if ((n?.c ?? 0) > 0) return;
  await addTemplate(sql, T, {
    name: "Estado de chasis",
    description: "Mapa de puntos sobre plano técnico: elevación, planta, frente y trasera.",
    category: "Chasis",
    kind: "chassis_map",
    fields: [],
  });
}
