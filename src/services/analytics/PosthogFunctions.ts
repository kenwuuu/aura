import posthog from 'posthog-js';
import {YSTATE_HEALTH} from "@/constants";

// HEALTH

export function trackHealthChange(currentHealth: any): void {
  posthog.capture('health_total_changed', {
    health_total: currentHealth,
  });
}

// DECK IMPORTER

export type ImportFailureReason =
  | 'invalid_format'
  | 'section_headers_detected'
  | 'parse_error'
  | 'no_valid_entries'
  | 'fetch_catastrophic_failure';

export function trackImportStarted(text: string): void {
  const lineCount = text.trim().split('\n').filter(line => line.trim().length > 0).length;

  posthog.capture('deck_import_started', {
    text_length: text.length,
    line_count: lineCount,
  });
}

export function trackImportFailed(
  reason: ImportFailureReason,
  extra: Record<string, unknown> = {}
): void {
  posthog.capture('deck_import_failed', {
    reason,
    ...extra,
  });
}

export function trackFallbackTriggered(auraFailedCount: number, totalCount: number): void {
  posthog.capture('deck_import_fallback_triggered', {
    aura_failed_count: auraFailedCount,
    total_count: totalCount,
  });
}

export function trackImportSucceeded(props: {
  cardCount: number;
  uniqueCardCount: number;
  durationMs: number;
}): void {
  posthog.capture('deck_import_succeeded', {
    card_count: props.cardCount,
    unique_card_count: props.uniqueCardCount,
    duration_ms: props.durationMs,
  });
}

export function trackImportPartialFailure(props: {
  totalRequested: number;
  totalImported: number;
  totalFailed: number;
  durationMs: number;
}): void {
  posthog.capture('deck_import_partial_failure', {
    total_requested: props.totalRequested,
    total_imported: props.totalImported,
    total_failed: props.totalFailed,
    failure_rate: props.totalRequested > 0 ? props.totalFailed / props.totalRequested : 0,
    duration_ms: props.durationMs,
  });
}