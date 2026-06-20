/**
 * @opennagi/protocol — OpenNagi の契約層の根。
 *
 * 受け口エンベロープ(送り手が投げる単一の入力)と、それを支える語彙
 * (緊急度・行動要否・送り手種別・通知ライフサイクル)、そして `/intake` の
 * OpenAPI 片を持つ。何にも依存しない。閉じる層(server / app)が一方向に依存する。
 */

// 語彙(enum)
export {
  ACTIONABLE_KINDS,
  ActionableSchema,
  NOTIFICATION_STATUSES,
  NotificationStatusSchema,
  SOURCE_KINDS,
  SourceKindSchema,
  URGENCY_LEVELS,
  UrgencySchema,
  type Actionable,
  type NotificationStatus,
  type SourceKind,
  type Urgency,
} from './enums.js';

// 受け口エンベロープ
export {
  IntakeEnvelopeSchema,
  SourceRefSchema,
  WhatSchema,
  parseIntakeEnvelope,
  type IntakeEnvelope,
  type SourceRef,
  type What,
} from './envelope.js';

// JSON Schema / OpenAPI 片
export {
  intakeEnvelopeJsonSchema,
  intakeJsonSchemaDocument,
  intakeOpenApiFragment,
} from './openapi.js';
