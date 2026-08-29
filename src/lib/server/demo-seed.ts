import { DEMO_ORGS, DEMO_PASSWORD, demoEmail, type DemoOrg } from "@/lib/demo-accounts";
import { DEVELOPER_EMAIL, DEVELOPER_EMAILS } from "@/lib/developer";
import { addDays, addMonths } from "@/lib/billing";
import { MODULES, type Role } from "@/lib/catalog";
import { getSql } from "@/lib/db";
import { ensureUsersWithPassword } from "@/lib/server/accounts";
import { stampNewOrgBilling } from "@/lib/server/billing";
import { seedOrgIfEmpty } from "@/lib/server/seed";
import { ensureChassisTemplate, seedEngine } from "@/lib/server/seed-engine";
import { ensureOrgTenant, schemaNameFromOrgId } from "@/lib/server/tenant-schema";
import { todayISO } from "@/lib/utils";

const globalRef = globalThis as typeof globalThis & {
  __inspectamxAuth_v4__?: Promise<void>;
  __inspectamxOps_v4__?: Promise<void>;
};
