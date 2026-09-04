import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const auditRuns = sqliteTable('audit_runs', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  ticker: text('ticker').notNull(),
  claimCount: integer('claim_count').notNull(),
  supportedCount: integer('supported_count').notNull(),
  flaggedCount: integer('flagged_count').notNull(),
  gateDecision: text('gate_decision').notNull(),
  preConfidence: integer('pre_confidence'),
  postConfidence: integer('post_confidence'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_audit_runs_created_at').on(table.createdAt),
  index('idx_audit_runs_agent_created').on(table.agentId, table.createdAt),
]);

export const behaviorEvents = sqliteTable('behavior_events', {
  id: text('id').primaryKey(),
  caseId: text('case_id'),
  eventName: text('event_name').notNull(),
  agentId: text('agent_id'),
  ticker: text('ticker'),
  metadataJson: text('metadata_json').notNull().default('{}'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_behavior_events_case_id').on(table.caseId),
  index('idx_behavior_events_created_at').on(table.createdAt),
]);
