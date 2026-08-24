const KEY = "inspectamx-offline-records";

export type QueuedRecord = {
  id: string;
  at: string;
  templateName: string;
  payload: unknown;
};

export function readQueue(): QueuedRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedRecord[]) : [];
  } catch {
    return [];
  }
}

export function pushQueue(item: Omit<QueuedRecord, "id" | "at">) {
  const next = [...readQueue(), { ...item, id: crypto.randomUUID(), at: new Date().toISOString() }];
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function writeQueue(items: QueuedRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
