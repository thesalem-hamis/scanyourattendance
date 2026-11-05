import { useCallback, useReducer } from 'react';
import { getErrorMessage } from '@/lib/error';
import { findExistingPhones, importMembers } from '../services/importService';
import type {
  ColumnMapping,
  ImportField,
  ImportOptions,
  ImportResult,
  ParsedCsv,
  ValidationResult,
} from '../types';
import { autoMapColumns } from '../utils/mapColumns';
import { parseCsvFile } from '../utils/parseCsv';
import { validateRows } from '../utils/validateRow';

export type ImportStep = 'upload' | 'map' | 'review' | 'importing' | 'done';

export interface ImportState {
  step: ImportStep;
  csv: ParsedCsv | null;
  mapping: ColumnMapping | null;
  options: ImportOptions;
  validation: ValidationResult | null;
  existing: ReadonlySet<string> | null;
  progress: { done: number; total: number };
  result: ImportResult | null;
  /** Something is loading (reading the file, checking existing members). */
  busy: boolean;
  error: string | null;
}

type Action =
  | { type: 'busy' }
  | { type: 'failed'; message: string }
  | { type: 'loaded'; csv: ParsedCsv; mapping: ColumnMapping }
  | { type: 'goto'; step: ImportStep }
  | { type: 'setMapping'; field: ImportField; header: string | null }
  | { type: 'setOptions'; patch: Partial<ImportOptions> }
  | { type: 'validated'; validation: ValidationResult; existing: ReadonlySet<string> }
  | { type: 'progress'; done: number; total: number }
  | { type: 'finished'; result: ImportResult }
  | { type: 'reset' };

const initialState: ImportState = {
  step: 'upload',
  csv: null,
  mapping: null,
  options: { fixedChurch: null, consentConfirmed: false, updateExisting: true },
  validation: null,
  existing: null,
  progress: { done: 0, total: 0 },
  result: null,
  busy: false,
  error: null,
};

function reducer(state: ImportState, action: Action): ImportState {
  switch (action.type) {
    case 'busy':
      return { ...state, busy: true, error: null };
    case 'failed':
      return { ...state, busy: false, error: action.message, step: state.step === 'importing' ? 'review' : state.step };
    case 'loaded':
      return { ...state, busy: false, error: null, csv: action.csv, mapping: action.mapping, validation: null, existing: null };
    case 'goto':
      return { ...state, step: action.step, error: null };
    case 'setMapping':
      return state.mapping
        ? { ...state, mapping: { ...state.mapping, [action.field]: action.header }, validation: null, existing: null }
        : state;
    case 'setOptions':
      // Changing which church to use changes what is valid, so the review has to be redone
      return {
        ...state,
        options: { ...state.options, ...action.patch },
        ...(action.patch.fixedChurch !== undefined ? { validation: null, existing: null } : {}),
      };
    case 'validated':
      return { ...state, busy: false, step: 'review', validation: action.validation, existing: action.existing };
    case 'progress':
      return { ...state, progress: { done: action.done, total: action.total } };
    case 'finished':
      return { ...state, step: 'done', result: action.result };
    case 'reset':
      return initialState;
  }
}

/** All the state and actions of the 4-step import wizard. */
export function useCSVImport() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadFile = useCallback(async (file: File) => {
    dispatch({ type: 'busy' });
    try {
      const csv = await parseCsvFile(file);
      dispatch({ type: 'loaded', csv, mapping: autoMapColumns(csv.headers) });
    } catch (error) {
      dispatch({ type: 'failed', message: getErrorMessage(error) });
    }
  }, []);

  const goTo = useCallback((step: ImportStep) => dispatch({ type: 'goto', step }), []);
  const setMapping = useCallback(
    (field: ImportField, header: string | null) => dispatch({ type: 'setMapping', field, header }),
    [],
  );
  const setOptions = useCallback((patch: Partial<ImportOptions>) => dispatch({ type: 'setOptions', patch }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  /** Checks every row, then asks the database which of those people are already members. */
  const review = useCallback(async () => {
    if (!state.csv || !state.mapping) return;
    dispatch({ type: 'busy' });
    try {
      const validation = validateRows(state.csv.rows, state.mapping, state.options.fixedChurch);
      const existing = await findExistingPhones(validation.valid.map((row) => row.phone));
      dispatch({ type: 'validated', validation, existing });
    } catch (error) {
      dispatch({ type: 'failed', message: getErrorMessage(error) });
    }
  }, [state.csv, state.mapping, state.options.fixedChurch]);

  const startImport = useCallback(async () => {
    if (!state.validation || !state.existing) return;
    dispatch({ type: 'goto', step: 'importing' });
    try {
      const result = await importMembers({
        rows: state.validation.valid,
        existing: state.existing,
        updateExisting: state.options.updateExisting,
        consentConfirmed: state.options.consentConfirmed,
        onProgress: (done, total) => dispatch({ type: 'progress', done, total }),
      });
      dispatch({ type: 'finished', result });
    } catch (error) {
      dispatch({ type: 'failed', message: getErrorMessage(error) });
    }
  }, [state.validation, state.existing, state.options.updateExisting, state.options.consentConfirmed]);

  return { state, loadFile, goTo, setMapping, setOptions, review, startImport, reset };
}

export type CSVImportFlow = ReturnType<typeof useCSVImport>;
