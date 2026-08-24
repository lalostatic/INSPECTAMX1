/**
 * INSPECTAMX — motor de plantillas (por empresa, esquema t_<uuid>).
 * Formularios, incidencias, evidencias, tareas, sucursales y reglas.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  answerPasses,
  DEFAULT_STATUSES,
  scoreLabel,
  type FieldType,
} from "@/lib/engine-catalog";
import { canAssignWork, canCreateInspection, canManageTemplates } from "@/lib/roles";
import { requireMembership } from "@/lib/server/tenant";
import { tenantTables, type TenantTables } from "@/lib/server/tenant-schema";
import type { Membership } from "@/lib/types";
import type { Sql } from "@/lib/db";

async function ctx(userId: string) {
  const m = await requireMembership(userId);
  const sql = await getSql();
  return { m, sql, T: tenantTables(m.dbSchema) };
}

function inspectorScope(m: Membership, userId: string) {
  return m.role === "inspector" ? userId : null;
}

export type TemplateListItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  kind: string;
  scoringEnabled: boolean;
  active: boolean;
  fieldCount: number;
};

export type TemplateField = {
  id: string;
  sortOrder: number;
  type: FieldType;
  label: string;
  required: boolean;
  options: string;
  weight: number;
  help: string;
};

export type TemplateStatus = {
  id: string;
  key: string;
  label: string;
  color: string;
  sortOrder: number;
  isInitial: boolean;
  isFinal: boolean;
};

export type TemplateDetail = TemplateListItem & {
  scoringMax: number;
  fields: TemplateField[];
  statuses: TemplateStatus[];
};

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<TemplateListItem[]> => {
    const { sql, T } = await ctx(context.userId);
    const rows = await sql.query<{
      id: string;
      name: string;
      description: string;
      category: string;
      kind: string;
      scoring_enabled: boolean;
      active: boolean;
      field_count: number;
    }>(
      `select t.id, t.name, t.description, t.category, t.kind, t.scoring_enabled, t.active,
              (select count(*)::int from ${T.template_fields} f where f.template_id = t.id) as field_count
       from ${T.templates} t order by t.name`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      kind: r.kind,
      scoringEnabled: Boolean(r.scoring_enabled),
      active: Boolean(r.active),
      fieldCount: Number(r.field_count) || 0,
    }));
  });

export const getTemplate = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ context, data }): Promise<TemplateDetail | null> => {
    const { sql, T } = await ctx(context.userId);
    const [t] = await sql.query<{
      id: string;
      name: string;
      description: string;
      category: string;
      kind: string;
      scoring_enabled: boolean;
      scoring_max: number;
      active: boolean;
    }>(`select * from ${T.templates} where id = $1`, [data.id]);
    if (!t) return null;
    const fields = await sql.query<{
      id: string;
      sort_order: number;
      type: string;
      label: string;
      required: boolean;
      options: string;
      weight: number;
      help: string;
    }>(`select * from ${T.template_fields} where template_id = $1 order by sort_order`, [data.id]);
    const statuses = await sql.query<{
      id: string;
      key: string;
      label: string;
      color: string;
      sort_order: number;
      is_initial: boolean;
      is_final: boolean;
    }>(`select * from ${T.template_statuses} where template_id = $1 order by sort_order`, [data.id]);
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      kind: t.kind,
      scoringEnabled: Boolean(t.scoring_enabled),
      scoringMax: t.scoring_max,
      active: Boolean(t.active),
      fieldCount: fields.length,
      fields: fields.map((f) => ({
        id: f.id,
        sortOrder: f.sort_order,
        type: f.type as FieldType,
        label: f.label,
        required: Boolean(f.required),
        options: f.options,
        weight: f.weight,
        help: f.help,
      })),
      statuses: statuses.map((s) => ({
        id: s.id,
        key: s.key,
        label: s.label,
        color: s.color,
        sortOrder: s.sort_order,
        isInitial: Boolean(s.is_initial),
        isFinal: Boolean(s.is_final),
      })),
    };
  });

const templateIn = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  description: z.string().max(400).default(""),
  category: z.string().max(40).default("Otro"),
  kind: z.enum(["form", "container_map"]).default("form"),
  scoringEnabled: z.boolean().default(true),
});

export const saveTemplate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => templateIn.parse(input))
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canManageTemplates(m.role)) throw new Error("Solo el administrador configura plantillas");
    const id = data.id || crypto.randomUUID();
    await sql.query(
      `insert into ${T.templates} (id, name, description, category, kind, scoring_enabled)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do update set
         name = excluded.name, description = excluded.description,
         category = excluded.category, kind = excluded.kind,
         scoring_enabled = excluded.scoring_enabled`,
      [id, data.name, data.description, data.category, data.kind, data.scoringEnabled],
    );
    const existing = await sql.query<{ c: number }>(
      `select count(*)::int as c from ${T.template_statuses} where template_id = $1`,
      [id],
    );
    if ((existing[0]?.c ?? 0) === 0) {
      let i = 0;
      for (const s of DEFAULT_STATUSES) {
        await sql.query(
          `insert into ${T.template_statuses} (id, template_id, key, label, color, sort_order, is_initial, is_final)
           values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [crypto.randomUUID(), id, s.key, s.label, s.color, i, Boolean(s.initial), Boolean(s.final)],
        );
        i += 1;
      }
    }
    return { id };
  });

const fieldsIn = z.object({
  templateId: z.string(),
  fields: z
    .array(
      z.object({
        id: z.string(),
        sortOrder: z.number().int(),
        type: z.string(),
        label: z.string().min(1).max(80),
        required: z.boolean(),
        options: z.string().max(400).default(""),
        weight: z.number().int().min(0).max(100).default(0),
        help: z.string().max(200).default(""),
      }),
    )
    .max(80),
});

export const saveTemplateFields = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => fieldsIn.parse(input))
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canManageTemplates(m.role)) throw new Error("Solo el administrador configura plantillas");
    await sql.query(`delete from ${T.template_fields} where template_id = $1`, [data.templateId]);
    for (const f of data.fields) {
      await sql.query(
        `insert into ${T.template_fields} (id, template_id, sort_order, type, label, required, options, weight, help)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [f.id, data.templateId, f.sortOrder, f.type, f.label, f.required, f.options, f.weight, f.help],
      );
    }
    return { ok: true };
  });

export const saveTemplateStatuses = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        templateId: z.string(),
        statuses: z.array(
          z.object({
            id: z.string(),
            key: z.string().min(1).max(40),
            label: z.string().min(1).max(40),
            color: z.string().max(20),
            sortOrder: z.number().int(),
            isInitial: z.boolean(),
            isFinal: z.boolean(),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canManageTemplates(m.role)) throw new Error("Solo el administrador configura plantillas");
    await sql.query(`delete from ${T.template_statuses} where template_id = $1`, [data.templateId]);
    for (const s of data.statuses) {
      await sql.query(
        `insert into ${T.template_statuses} (id, template_id, key, label, color, sort_order, is_initial, is_final)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [s.id, data.templateId, s.key, s.label, s.color, s.sortOrder, s.isInitial, s.isFinal],
      );
    }
    return { ok: true };
  });

export type Branch = { id: string; name: string; city: string; address: string };

export const listBranches = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Branch[]> => {
    const { sql, T } = await ctx(context.userId);
    const rows = await sql.query<Branch>(`select id, name, city, address from ${T.branches} order by name`);
    return rows;
  });

export const saveBranch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string().optional(), name: z.string().min(2).max(80), city: z.string().max(80).default(""), address: z.string().max(160).default("") }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canManageTemplates(m.role)) throw new Error("Solo el administrador da de alta sucursales");
    const id = data.id || crypto.randomUUID();
    await sql.query(
      `insert into ${T.branches} (id, name, city, address) values ($1,$2,$3,$4)
       on conflict (id) do update set name = excluded.name, city = excluded.city, address = excluded.address`,
      [id, data.name, data.city, data.address],
    );
    return { id };
  });

export type Asset = { id: string; code: string; kind: string; name: string; branchId: string; notes: string };

export const listAssets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Asset[]> => {
    const { sql, T } = await ctx(context.userId);
    const rows = await sql.query<{
      id: string;
      code: string;
      kind: string;
      name: string;
      branch_id: string;
      notes: string;
    }>(`select id, code, kind, name, branch_id, notes from ${T.assets} order by code`);
    return rows.map((r) => ({ id: r.id, code: r.code, kind: r.kind, name: r.name, branchId: r.branch_id, notes: r.notes }));
  });

export const saveAsset = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().optional(),
        code: z.string().min(1).max(40),
        kind: z.string().max(40).default("otro"),
        name: z.string().max(80).default(""),
        branchId: z.string().default(""),
        notes: z.string().max(200).default(""),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canAssignWork(m.role) && !canCreateInspection(m.role)) throw new Error("Sin permiso");
    const id = data.id || crypto.randomUUID();
    await sql.query(
      `insert into ${T.assets} (id, code, kind, name, branch_id, notes) values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do update set code = excluded.code, kind = excluded.kind, name = excluded.name,
         branch_id = excluded.branch_id, notes = excluded.notes`,
      [id, data.code, data.kind, data.name, data.branchId, data.notes],
    );
    return { id };
  });

export const listIncidentTypes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { sql, T } = await ctx(context.userId);
    return sql.query<{ id: string; name: string; severity: string }>(
      `select id, name, severity from ${T.incident_types} order by name`,
    );
  });

export const saveIncidentType = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ name: z.string().min(2).max(40), severity: z.string().max(20).default("media") }).parse(input))
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canManageTemplates(m.role)) throw new Error("Solo el administrador");
    await sql.query(`insert into ${T.incident_types} (id, name, severity) values ($1,$2,$3)`, [
      crypto.randomUUID(),
      data.name,
      data.severity,
    ]);
    return { ok: true };
  });

export type RecordListItem = {
  id: string;
  folio: string;
  templateName: string;
  inspectorName: string;
  status: string;
  score: number | null;
  scoreLabel: string;
  tags: string;
  createdAt: string;
  assetCode: string;
};

function asIso(v: unknown) {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function folioLabel(n: number) {
  return `INS-${String(n).padStart(6, "0")}`;
}

export const listRecords = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<RecordListItem[]> => {
    const { m, sql, T } = await ctx(context.userId);
    const mine = inspectorScope(m, context.userId);
    const rows = await sql.query<{
      id: string;
      folio: number;
      template_name: string;
      inspector_name: string;
      status: string;
      score: number | null;
      score_label: string;
      tags: string;
      created_at: string;
      asset_code: string;
    }>(
      `select r.id, r.folio, coalesce(t.name,'Plantilla') as template_name, r.inspector_name, r.status,
              r.score, r.score_label, r.tags, r.created_at, coalesce(a.code,'') as asset_code
       from ${T.records} r
       left join ${T.templates} t on t.id = r.template_id
       left join ${T.assets} a on a.id = r.asset_id
       where ($1::text is null or r.user_id = $1 or r.assigned_to = $1)
       order by r.created_at desc limit 200`,
      [mine],
    );
    return rows.map((r) => ({
      id: r.id,
      folio: folioLabel(r.folio),
      templateName: r.template_name,
      inspectorName: r.inspector_name,
      status: r.status,
      score: r.score,
      scoreLabel: r.score_label,
      tags: r.tags,
      createdAt: asIso(r.created_at),
      assetCode: r.asset_code,
    }));
  });

export type RecordDetail = RecordListItem & {
  templateId: string;
  statusLabel: string;
  notes: string;
  lat: number | null;
  lng: number | null;
  gpsAccuracy: number | null;
  assignedName: string;
  priority: string;
  answers: { fieldId: string; label: string; type: string; value: string; weight: number }[];
  incidents: { id: string; typeName: string; severity: string; title: string; notes: string }[];
  evidence: { id: string; kind: string; dataUrl: string; caption: string }[];
  events: { id: string; at: string; actor: string; kind: string; message: string }[];
};

export const getRecord = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ context, data }): Promise<RecordDetail | null> => {
    const { m, sql, T } = await ctx(context.userId);
    const mine = inspectorScope(m, context.userId);
    const [r] = await sql.query<{
      id: string;
      folio: number;
      template_id: string;
      template_name: string;
      inspector_name: string;
      status: string;
      score: number | null;
      score_label: string;
      tags: string;
      created_at: string;
      notes: string;
      lat: number | null;
      lng: number | null;
      gps_accuracy: number | null;
      assigned_name: string;
      priority: string;
      asset_code: string;
      user_id: string;
      assigned_to: string;
    }>(
      `select r.*, coalesce(t.name,'Plantilla') as template_name, coalesce(a.code,'') as asset_code
       from ${T.records} r
       left join ${T.templates} t on t.id = r.template_id
       left join ${T.assets} a on a.id = r.asset_id
       where r.id = $1`,
      [data.id],
    );
    if (!r) return null;
    if (mine && r.user_id !== mine && r.assigned_to !== mine) throw new Error("Sin acceso a este folio");
    const [st] = await sql.query<{ label: string }>(
      `select label from ${T.template_statuses} where template_id = $1 and key = $2 limit 1`,
      [r.template_id, r.status],
    );
    const answers = await sql.query<{ field_id: string; label: string; type: string; value: string; weight: number }>(
      `select a.field_id, f.label, f.type, a.value, f.weight
       from ${T.record_answers} a
       join ${T.template_fields} f on f.id = a.field_id
       where a.record_id = $1 order by f.sort_order`,
      [data.id],
    );
    const incidents = await sql.query<{ id: string; type_name: string; severity: string; title: string; notes: string }>(
      `select id, type_name, severity, title, notes from ${T.record_incidents} where record_id = $1 order by created_at`,
      [data.id],
    );
    const evidence = await sql.query<{ id: string; kind: string; data_url: string; caption: string }>(
      `select id, kind, data_url, caption from ${T.record_evidence} where record_id = $1 order by created_at`,
      [data.id],
    );
    const events = await sql.query<{ id: string; at: string; actor: string; kind: string; message: string }>(
      `select id, at, actor, kind, message from ${T.record_events} where record_id = $1 order by at`,
      [data.id],
    );
    return {
      id: r.id,
      folio: folioLabel(r.folio),
      templateId: r.template_id,
      templateName: r.template_name,
      inspectorName: r.inspector_name,
      status: r.status,
      statusLabel: st?.label ?? r.status,
      score: r.score,
      scoreLabel: r.score_label,
      tags: r.tags,
      createdAt: asIso(r.created_at),
      assetCode: r.asset_code,
      notes: r.notes,
      lat: r.lat,
      lng: r.lng,
      gpsAccuracy: r.gps_accuracy,
      assignedName: r.assigned_name,
      priority: r.priority,
      answers: answers.map((a) => ({
        fieldId: a.field_id,
        label: a.label,
        type: a.type,
        value: a.value,
        weight: a.weight,
      })),
      incidents: incidents.map((i) => ({
        id: i.id,
        typeName: i.type_name,
        severity: i.severity,
        title: i.title,
        notes: i.notes,
      })),
      evidence: evidence.map((e) => ({ id: e.id, kind: e.kind, dataUrl: e.data_url, caption: e.caption })),
      events: events.map((e) => ({
        id: e.id,
        at: String(e.at),
        actor: e.actor,
        kind: e.kind,
        message: e.message,
      })),
    };
  });

const answerIn = z.object({ fieldId: z.string(), value: z.string().max(200000) });

const saveRecordIn = z.object({
  id: z.string().optional(),
  templateId: z.string(),
  assetId: z.string().default(""),
  branchId: z.string().default(""),
  tags: z.string().max(200).default(""),
  notes: z.string().max(2000).default(""),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  gpsAccuracy: z.number().nullable().optional(),
  answers: z.array(answerIn).max(80),
  incidents: z
    .array(
      z.object({
        typeName: z.string().max(40),
        severity: z.string().max(20),
        title: z.string().max(120),
        notes: z.string().max(400).default(""),
      }),
    )
    .max(20)
    .default([]),
  evidence: z
    .array(z.object({ kind: z.string().max(20), dataUrl: z.string().max(4_000_000), caption: z.string().max(120).default("") }))
    .max(12)
    .default([]),
  submit: z.boolean().default(false),
});

function computeScore(
  fields: { id: string; weight: number; type: string }[],
  answers: { fieldId: string; value: string }[],
) {
  const weighted = fields.filter((f) => f.weight > 0);
  if (weighted.length === 0) return { score: null as number | null, label: "" };
  const map = new Map(answers.map((a) => [a.fieldId, a.value]));
  let got = 0;
  let max = 0;
  for (const f of weighted) {
    max += f.weight;
    const v = map.get(f.id) ?? "";
    if (answerPasses(v)) got += f.weight;
  }
  const score = max === 0 ? 0 : Math.round((got / max) * 100);
  return { score, label: scoreLabel(score) };
}

async function addEvent(sql: Sql, T: TenantTables, recordId: string, actor: string, kind: string, message: string) {
  await sql.query(`insert into ${T.record_events} (id, record_id, actor, kind, message) values ($1,$2,$3,$4,$5)`, [
    crypto.randomUUID(),
    recordId,
    actor,
    kind,
    message,
  ]);
}

async function runAutomations(
  sql: Sql,
  T: TenantTables,
  opts: {
    templateId: string;
    recordId: string;
    status: string;
    score: number | null;
    incidents: { severity: string }[];
    actor: string;
    userId: string;
  },
) {
  const rules = await sql.query<{ when_event: string; then_action: string; name: string }>(
    `select when_event, then_action, name from ${T.automations} where active = true
     and (template_id = '' or template_id = $1)`,
    [opts.templateId],
  );
  const crit = opts.incidents.some((i) => i.severity === "critica");
  for (const rule of rules) {
    const fire =
      (rule.when_event === "incidencia_critica" && crit) ||
      (rule.when_event === "rechazada" && opts.status === "rechazado") ||
      (rule.when_event === "score_critico" && opts.score !== null && opts.score < 70);
    if (!fire) continue;
    await addEvent(sql, T, opts.recordId, opts.actor, "regla", `Regla «${rule.name}»: ${rule.then_action}`);
    if (rule.then_action === "crear_tarea") {
      await sql.query(
        `insert into ${T.assignments} (id, record_id, template_id, title, priority, status, created_by)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [
          crypto.randomUUID(),
          opts.recordId,
          opts.templateId,
          "Corrección automática",
          "alta",
          "abierta",
          opts.userId,
        ],
      );
    }
  }
}

export const saveRecord = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => saveRecordIn.parse(input))
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canCreateInspection(m.role) && m.role !== "office") throw new Error("Su perfil no captura inspecciones");
    const fields = await sql.query<{ id: string; weight: number; type: string; required: boolean; label: string }>(
      `select id, weight, type, required, label from ${T.template_fields} where template_id = $1`,
      [data.templateId],
    );
    if (data.submit) {
      for (const f of fields) {
        if (!f.required) continue;
        const a = data.answers.find((x) => x.fieldId === f.id);
        if (!a?.value) throw new Error(`Falta: ${f.label}`);
      }
    }
    const { score, label } = computeScore(fields, data.answers);
    let id = data.id;
    let folio = 1;
    const [init] = await sql.query<{ key: string }>(
      `select key from ${T.template_statuses} where template_id = $1 and is_initial = true order by sort_order limit 1`,
      [data.templateId],
    );
    const status = data.submit ? "en_proceso" : (init?.key ?? "borrador");
    const device = "web";
    if (!id) {
      const [n] = await sql.query<{ n: number }>(`select coalesce(max(folio),0)::int as n from ${T.records}`);
      folio = (n?.n ?? 0) + 1;
      id = crypto.randomUUID();
      await sql.query(
        `insert into ${T.records} (
           id, folio, template_id, asset_id, branch_id, user_id, inspector_name, status,
           score, score_label, lat, lng, gps_accuracy, device, tags, notes, submitted_at
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          id,
          folio,
          data.templateId,
          data.assetId,
          data.branchId,
          context.userId,
          m.displayName,
          status,
          score,
          label,
          data.lat ?? null,
          data.lng ?? null,
          data.gpsAccuracy ?? null,
          device,
          data.tags,
          data.notes,
          data.submit ? new Date().toISOString() : null,
        ],
      );
      await addEvent(sql, T, id, m.displayName, "alta", data.submit ? "Inspección enviada" : "Borrador creado");
    } else {
      await sql.query(
        `update ${T.records} set asset_id=$2, branch_id=$3, status=$4, score=$5, score_label=$6,
           lat=$7, lng=$8, gps_accuracy=$9, tags=$10, notes=$11, submitted_at = coalesce(submitted_at, $12)
         where id = $1`,
        [
          id,
          data.assetId,
          data.branchId,
          status,
          score,
          label,
          data.lat ?? null,
          data.lng ?? null,
          data.gpsAccuracy ?? null,
          data.tags,
          data.notes,
          data.submit ? new Date().toISOString() : null,
        ],
      );
      await sql.query(`delete from ${T.record_answers} where record_id = $1`, [id]);
      await sql.query(`delete from ${T.record_incidents} where record_id = $1`, [id]);
      await addEvent(sql, T, id, m.displayName, "edicion", data.submit ? "Enviada" : "Borrador actualizado");
    }
    for (const a of data.answers) {
      await sql.query(`insert into ${T.record_answers} (id, record_id, field_id, value) values ($1,$2,$3,$4)`, [
        crypto.randomUUID(),
        id,
        a.fieldId,
        a.value,
      ]);
    }
    for (const inc of data.incidents) {
      await sql.query(
        `insert into ${T.record_incidents} (id, record_id, type_name, severity, title, notes, lat, lng)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [crypto.randomUUID(), id, inc.typeName, inc.severity, inc.title, inc.notes, data.lat ?? null, data.lng ?? null],
      );
    }
    for (const ev of data.evidence) {
      await sql.query(
        `insert into ${T.record_evidence} (id, record_id, kind, data_url, caption) values ($1,$2,$3,$4,$5)`,
        [crypto.randomUUID(), id, ev.kind, ev.dataUrl, ev.caption],
      );
    }
    if (data.submit) {
      await runAutomations(sql, T, {
        templateId: data.templateId,
        recordId: id,
        status,
        score,
        incidents: data.incidents,
        actor: m.displayName,
        userId: context.userId,
      });
    }
    return { id, folio: folioLabel(folio), score, scoreLabel: label };
  });

export const setRecordStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string(), status: z.string().max(40) }).parse(input))
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canAssignWork(m.role)) throw new Error("Sin permiso para cambiar estado");
    await sql.query(`update ${T.records} set status = $2 where id = $1`, [data.id, data.status]);
    await addEvent(sql, T, data.id, m.displayName, "estado", `Estado: ${data.status}`);
    const [rec] = await sql.query<{ template_id: string; score: number | null }>(
      `select template_id, score from ${T.records} where id = $1`,
      [data.id],
    );
    if (rec) {
      await runAutomations(sql, T, {
        templateId: rec.template_id,
        recordId: data.id,
        status: data.status,
        score: rec.score,
        incidents: [],
        actor: m.displayName,
        userId: context.userId,
      });
    }
    return { ok: true };
  });

export const addRecordIncident = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        recordId: z.string(),
        typeName: z.string().min(2).max(40),
        severity: z.string().max(20),
        title: z.string().min(2).max(120),
        notes: z.string().max(400).default(""),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (m.role === "consulta") throw new Error("Consulta no registra incidencias");
    await sql.query(
      `insert into ${T.record_incidents} (id, record_id, type_name, severity, title, notes)
       values ($1,$2,$3,$4,$5,$6)`,
      [crypto.randomUUID(), data.recordId, data.typeName, data.severity, data.title, data.notes],
    );
    await addEvent(sql, T, data.recordId, m.displayName, "incidencia", data.title);
    return { ok: true };
  });

export type Assignment = {
  id: string;
  title: string;
  assignedName: string;
  locationName: string;
  dueAt: string | null;
  priority: string;
  status: string;
  templateId: string;
  recordId: string;
};

export const listAssignments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Assignment[]> => {
    const { m, sql, T } = await ctx(context.userId);
    const mine = inspectorScope(m, context.userId);
    const rows = await sql.query<{
      id: string;
      title: string;
      assigned_name: string;
      location_name: string;
      due_at: string | null;
      priority: string;
      status: string;
      template_id: string;
      record_id: string;
    }>(
      `select id, title, assigned_name, location_name, due_at, priority, status, template_id, record_id
       from ${T.assignments}
       where ($1::text is null or assigned_to = $1)
       order by created_at desc limit 100`,
      [mine],
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      assignedName: r.assigned_name,
      locationName: r.location_name,
      dueAt: r.due_at ? asIso(r.due_at) : null,
      priority: r.priority,
      status: r.status,
      templateId: r.template_id,
      recordId: r.record_id,
    }));
  });

export const createAssignment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        title: z.string().min(2).max(120),
        assignedTo: z.string().default(""),
        assignedName: z.string().max(80).default(""),
        locationName: z.string().max(80).default(""),
        dueAt: z.string().optional(),
        priority: z.string().max(20).default("media"),
        templateId: z.string().default(""),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canAssignWork(m.role)) throw new Error("Sin permiso para asignar");
    const id = crypto.randomUUID();
    await sql.query(
      `insert into ${T.assignments} (id, template_id, title, assigned_to, assigned_name, location_name, due_at, priority, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        data.templateId,
        data.title,
        data.assignedTo,
        data.assignedName,
        data.locationName,
        data.dueAt || null,
        data.priority,
        context.userId,
      ],
    );
    return { id };
  });

export const setAssignmentStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string(), status: z.string().max(20) }).parse(input))
  .handler(async ({ context, data }) => {
    const { sql, T } = await ctx(context.userId);
    await sql.query(`update ${T.assignments} set status = $2 where id = $1`, [data.id, data.status]);
    return { ok: true };
  });

export type Automation = { id: string; name: string; active: boolean; whenEvent: string; thenAction: string };

export const listAutomations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Automation[]> => {
    const { sql, T } = await ctx(context.userId);
    const rows = await sql.query<{ id: string; name: string; active: boolean; when_event: string; then_action: string }>(
      `select id, name, active, when_event, then_action from ${T.automations} order by name`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      active: Boolean(r.active),
      whenEvent: r.when_event,
      thenAction: r.then_action,
    }));
  });

export const saveAutomation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        name: z.string().min(2).max(80),
        whenEvent: z.string().max(40),
        thenAction: z.string().max(40),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canManageTemplates(m.role)) throw new Error("Solo el administrador");
    await sql.query(
      `insert into ${T.automations} (id, name, when_event, then_action) values ($1,$2,$3,$4)`,
      [crypto.randomUUID(), data.name, data.whenEvent, data.thenAction],
    );
    return { ok: true };
  });

export const toggleAutomation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string(), active: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canManageTemplates(m.role)) throw new Error("Solo el administrador");
    await sql.query(`update ${T.automations} set active = $2 where id = $1`, [data.id, data.active]);
    return { ok: true };
  });

export type EngineDash = {
  records: number;
  recordsToday: number;
  incidents: number;
  incidentsOpen: number;
  tasksOpen: number;
  avgScore: number | null;
  byStatus: { status: string; c: number }[];
  live: RecordListItem[];
  widgets: string[];
};

export const getEngineDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<EngineDash> => {
    const { sql, T } = await ctx(context.userId);
    const [c] = await sql.query<{ c: number }>(`select count(*)::int as c from ${T.records}`);
    const [today] = await sql.query<{ c: number }>(
      `select count(*)::int as c from ${T.records} where created_at >= date_trunc('day', now())`,
    );
    const [inc] = await sql.query<{ c: number }>(`select count(*)::int as c from ${T.record_incidents}`);
    const [tasks] = await sql.query<{ c: number }>(
      `select count(*)::int as c from ${T.assignments} where status = 'abierta'`,
    );
    const [avg] = await sql.query<{ a: number | null }>(`select avg(score)::int as a from ${T.records} where score is not null`);
    const byStatus = await sql.query<{ status: string; c: number }>(
      `select status, count(*)::int as c from ${T.records} group by status order by c desc`,
    );
    const liveRows = await sql.query<{
      id: string;
      folio: number;
      template_name: string;
      inspector_name: string;
      status: string;
      score: number | null;
      score_label: string;
      tags: string;
      created_at: string;
      asset_code: string;
    }>(
      `select r.id, r.folio, coalesce(t.name,'') as template_name, r.inspector_name, r.status,
              r.score, r.score_label, r.tags, r.created_at, coalesce(a.code,'') as asset_code
       from ${T.records} r
       left join ${T.templates} t on t.id = r.template_id
       left join ${T.assets} a on a.id = r.asset_id
       order by r.created_at desc limit 12`,
    );
    const [pref] = await sql.query<{ widgets: string }>(`select widgets from ${T.dashboard_prefs} where id = 'default'`);
    const widgets = (pref?.widgets || "inspecciones,incidencias,estados,tareas,score,vivos").split(",").filter(Boolean);
    return {
      records: c?.c ?? 0,
      recordsToday: today?.c ?? 0,
      incidents: inc?.c ?? 0,
      incidentsOpen: inc?.c ?? 0,
      tasksOpen: tasks?.c ?? 0,
      avgScore: avg?.a ?? null,
      byStatus,
      live: liveRows.map((r) => ({
        id: r.id,
        folio: folioLabel(r.folio),
        templateName: r.template_name,
        inspectorName: r.inspector_name,
        status: r.status,
        score: r.score,
        scoreLabel: r.score_label,
        tags: r.tags,
        createdAt: asIso(r.created_at),
        assetCode: r.asset_code,
      })),
      widgets,
    };
  });

export const saveDashboardPrefs = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ widgets: z.array(z.string()).max(12) }).parse(input))
  .handler(async ({ context, data }) => {
    const { m, sql, T } = await ctx(context.userId);
    if (!canManageTemplates(m.role)) throw new Error("Solo el administrador");
    await sql.query(
      `insert into ${T.dashboard_prefs} (id, widgets) values ('default', $1)
       on conflict (id) do update set widgets = excluded.widgets`,
      [data.widgets.join(",")],
    );
    return { ok: true };
  });

export type SearchHit = { kind: string; id: string; title: string; subtitle: string; href: string };

export const globalSearch = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ q: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ context, data }): Promise<SearchHit[]> => {
    const { m, sql, T } = await ctx(context.userId);
    const q = `%${data.q.trim()}%`;
    const hits: SearchHit[] = [];
    const recs = await sql.query<{ id: string; folio: number; inspector_name: string; tags: string }>(
      `select id, folio, inspector_name, tags from ${T.records}
       where inspector_name ilike $1 or tags ilike $1 or notes ilike $1 or cast(folio as text) like $2
       limit 12`,
      [q, `%${data.q.replace(/\D/g, "")}%`],
    );
    for (const r of recs) {
      hits.push({
        kind: "Inspección",
        id: r.id,
        title: folioLabel(r.folio),
        subtitle: r.inspector_name,
        href: `/registros/${r.id}`,
      });
    }
    const assets = await sql.query<{ id: string; code: string; name: string; kind: string }>(
      `select id, code, name, kind from ${T.assets} where code ilike $1 or name ilike $1 limit 8`,
      [q],
    );
    for (const a of assets) {
      hits.push({ kind: "Activo", id: a.id, title: a.code || a.name, subtitle: a.kind, href: "/activos" });
    }
    const incs = await sql.query<{ id: string; title: string; type_name: string; record_id: string }>(
      `select id, title, type_name, record_id from ${T.record_incidents} where title ilike $1 or notes ilike $1 limit 8`,
      [q],
    );
    for (const i of incs) {
      hits.push({
        kind: "Incidencia",
        id: i.id,
        title: i.title,
        subtitle: i.type_name,
        href: `/registros/${i.record_id}`,
      });
    }
    if (m.role === "admin" || m.role === "office") {
      const users = await sql.query<{ display_name: string; role: string }>(
        `select display_name, role from org_members where org_id = $1 and display_name ilike $2 limit 6`,
        [m.orgId, q],
      );
      for (const u of users) {
        hits.push({ kind: "Usuario", id: u.display_name, title: u.display_name, subtitle: u.role, href: "/equipo" });
      }
    }
    return hits;
  });

export const listAllIncidents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { sql, T } = await ctx(context.userId);
    const rows = await sql.query<{
      id: string;
      title: string;
      type_name: string;
      severity: string;
      record_id: string;
      folio: number;
      created_at: string;
    }>(
      `select i.id, i.title, i.type_name, i.severity, i.record_id, r.folio, i.created_at
       from ${T.record_incidents} i
       join ${T.records} r on r.id = i.record_id
       order by i.created_at desc limit 80`,
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      typeName: r.type_name,
      severity: r.severity,
      recordId: r.record_id,
      folio: folioLabel(r.folio),
      createdAt: asIso(r.created_at),
    }));
  });

export const assetHistory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ assetId: z.string() }).parse(input))
  .handler(async ({ context, data }) => {
    const { sql, T } = await ctx(context.userId);
    const recs = await sql.query<{ id: string; folio: number; created_at: string; status: string; inspector_name: string }>(
      `select id, folio, created_at, status, inspector_name from ${T.records} where asset_id = $1 order by created_at desc`,
      [data.assetId],
    );
    const incs = await sql.query<{ title: string; created_at: string; record_id: string }>(
      `select i.title, i.created_at, i.record_id from ${T.record_incidents} i
       join ${T.records} r on r.id = i.record_id where r.asset_id = $1 order by i.created_at desc`,
      [data.assetId],
    );
    return {
      records: recs.map((r) => ({
        id: r.id,
        folio: folioLabel(r.folio),
        at: String(r.created_at),
        status: r.status,
        inspectorName: r.inspector_name,
      })),
      incidents: incs.map((i) => ({ title: i.title, at: String(i.created_at), recordId: i.record_id })),
    };
  });
