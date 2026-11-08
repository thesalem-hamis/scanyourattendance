import { z } from 'zod';
import {
  DEFAULT_MESSAGE_TEMPLATES,
  TEMPLATE_META,
  validateTemplate,
  type MessageTemplateKey,
} from '@/config/messageTemplates';
import { AppError, toAppError } from '@/lib/error';
import { supabase } from '@/lib/supabase';
import type { StaffRole } from '@/types';

export type Templates = Record<MessageTemplateKey, string>;

const KEYS = Object.keys(DEFAULT_MESSAGE_TEMPLATES) as MessageTemplateKey[];

/** Saved wording on top of the built-in wording. Anything missing or odd falls back to the default. */
export function mergeTemplates(rows: readonly { key: string; value: unknown }[]): Templates {
  const merged: Templates = { ...DEFAULT_MESSAGE_TEMPLATES };
  for (const key of KEYS) {
    const row = rows.find((r) => r.key === TEMPLATE_META[key].dbKey);
    if (row && typeof row.value === 'string' && row.value.trim() !== '') merged[key] = row.value;
  }
  return merged;
}

export async function getTemplates(): Promise<Templates> {
  const { data, error } = await supabase.from('app_settings').select('key, value');
  if (error) throw toAppError(error);
  return mergeTemplates(data);
}

export async function saveTemplate(key: MessageTemplateKey, text: string): Promise<void> {
  const problem = validateTemplate(key, text);
  if (problem) throw new AppError(problem, 'validation');

  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ key: TEMPLATE_META[key].dbKey, value: text.trim() }, { onConflict: 'key' })
    .select('key')
    .maybeSingle();
  if (error) throw toAppError(error);
  // Row-level security silently refuses people who may not change settings
  if (!data) throw new AppError("You don't have permission to change the wording.", 'permission');
}

/** Back to the built-in wording: delete the saved row. */
export async function resetTemplate(key: MessageTemplateKey): Promise<void> {
  const { error } = await supabase.from('app_settings').delete().eq('key', TEMPLATE_META[key].dbKey);
  if (error) throw toAppError(error);
}

export interface StaffMember {
  id: string;
  role: StaffRole;
  fullName: string | null;
  createdAt: string;
}

const staffRows = z.array(
  z.object({ id: z.string(), role: z.enum(['admin', 'usher']), full_name: z.string().nullable(), created_at: z.string() }),
);

export async function getStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase.from('profiles').select('id, role, full_name, created_at').order('created_at');
  if (error) throw toAppError(error);
  const parsed = staffRows.safeParse(data);
  if (!parsed.success) throw new AppError('Unexpected response from the server. Please try again.', 'unknown', parsed.error);
  return parsed.data.map((row) => ({ id: row.id, role: row.role, fullName: row.full_name, createdAt: row.created_at }));
}
