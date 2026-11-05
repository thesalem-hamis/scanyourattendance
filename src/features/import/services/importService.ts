import { toAppError } from '@/lib/error';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types';
import type { ImportResult, ImportRow } from '../types';

type MemberInsert = Database['public']['Tables']['members']['Insert'];

export const BATCH_SIZE = 500;
const LOOKUP_SIZE = 200;

export const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const parts: T[][] = [];
  for (let i = 0; i < items.length; i += size) parts.push(items.slice(i, i + size));
  return parts;
};

/** Which of these phone numbers already belong to a member? */
export async function findExistingPhones(phones: readonly string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (const part of chunk(phones, LOOKUP_SIZE)) {
    const { data, error } = await supabase.from('members').select('phone').in('phone', part);
    if (error) throw toAppError(error);
    for (const row of data) found.add(row.phone);
  }
  return found;
}

export interface ImportRequest {
  rows: readonly ImportRow[];
  /** Phone numbers that are already members (from findExistingPhones). */
  existing: ReadonlySet<string>;
  updateExisting: boolean;
  consentConfirmed: boolean;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Saves the rows in batches of 500. New people are added; people already on the list are
 * updated (or left alone). The payload never contains member_code, qr_token or status, so an
 * existing member keeps their pass. If one batch fails the rest still go ahead.
 */
export async function importMembers({
  rows,
  existing,
  updateExisting,
  consentConfirmed,
  onProgress,
}: ImportRequest): Promise<ImportResult> {
  const consentAt = consentConfirmed ? new Date().toISOString() : null;

  const toPayload = (row: ImportRow, isNew: boolean): MemberInsert => ({
    full_name: row.fullName,
    phone: row.phone,
    age: row.age,
    gender: row.gender,
    church_group: row.churchGroup,
    // Consent is only recorded for people added now: we never rewrite it for existing members
    ...(isNew && consentAt ? { consent_at: consentAt } : {}),
  });

  const newRows = rows.filter((row) => !existing.has(row.phone));
  const existingRows = rows.filter((row) => existing.has(row.phone));

  const batches = [
    ...chunk(newRows, BATCH_SIZE).map((batch) => ({ isNew: true, batch })),
    ...(updateExisting ? chunk(existingRows, BATCH_SIZE).map((batch) => ({ isNew: false, batch })) : []),
  ];
  const total = batches.reduce((sum, { batch }) => sum + batch.length, 0);

  const result: ImportResult = {
    created: 0,
    updated: 0,
    skippedExisting: updateExisting ? 0 : existingRows.length,
    failedBatches: [],
  };

  let done = 0;
  onProgress?.(0, total);

  for (const { isNew, batch } of batches) {
    try {
      const payload = batch.map((row) => toPayload(row, isNew));
      const { data, error } = isNew
        ? // ignoreDuplicates: if someone registered in the meantime, don't overwrite them
          await supabase.from('members').upsert(payload, { onConflict: 'phone', ignoreDuplicates: true }).select('id')
        : await supabase.from('members').upsert(payload, { onConflict: 'phone' }).select('id');
      if (error) throw error;

      if (isNew) {
        result.created += data.length;
        result.skippedExisting += batch.length - data.length;
      } else {
        result.updated += data.length;
      }
    } catch (error) {
      result.failedBatches.push({ rowNumbers: batch.map((row) => row.rowNumber), message: toAppError(error).message });
    }
    done += batch.length;
    onProgress?.(done, total);
  }

  return result;
}
