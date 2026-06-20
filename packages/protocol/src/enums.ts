import { z } from 'zod';

/**
 * 送り手が主張する緊急度。4段。
 * ただし最終判断は OpenNagi が持つ。送り手の主張は入力の一つにすぎない。
 * (protocol.md「文脈4点」)
 */
export const URGENCY_LEVELS = ['critical', 'high', 'normal', 'low'] as const;
export const UrgencySchema = z
  .enum(URGENCY_LEVELS)
  .meta({ description: '送り手が主張する緊急度。critical / high / normal / low の4段。' });
export type Urgency = z.infer<typeof UrgencySchema>;

/**
 * 人間の判断や行動が要るか、単なる報告か。2値。
 */
export const ACTIONABLE_KINDS = ['action_required', 'fyi'] as const;
export const ActionableSchema = z
  .enum(ACTIONABLE_KINDS)
  .meta({ description: '行動が要る(action_required)か、単なる報告(fyi)か。' });
export type Actionable = z.infer<typeof ActionableSchema>;

/**
 * 送り手の種別。RSS は「最初の1クライアント」であり、特別な経路ではない。
 * webhook / email / calendar / agent は種別が増えるだけで同じ受け口に乗る。
 */
export const SOURCE_KINDS = ['rss', 'webhook', 'email', 'calendar', 'agent'] as const;
export const SourceKindSchema = z
  .enum(SOURCE_KINDS)
  .meta({ description: '送り手の種別。rss / webhook / email / calendar / agent。' });
export type SourceKind = z.infer<typeof SourceKindSchema>;

/**
 * 通知のライフサイクル status。
 *
 *   received → pending →(配信時)→ bundled
 *                                ├→ silenced  (期限切れ・ノイズ)
 *                                └→ escalated (緊急の割り込み)
 *
 * MVP で動かすのは received → pending → bundled と、expiry 切れの silenced だけ。
 * escalated は第二段(選別)の出口として器だけ持つ。(protocol.md)
 */
export const NOTIFICATION_STATUSES = [
  'received',
  'pending',
  'bundled',
  'silenced',
  'escalated',
] as const;
export const NotificationStatusSchema = z.enum(NOTIFICATION_STATUSES).meta({
  description: '通知のライフサイクル。received / pending / bundled / silenced / escalated。',
});
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;
