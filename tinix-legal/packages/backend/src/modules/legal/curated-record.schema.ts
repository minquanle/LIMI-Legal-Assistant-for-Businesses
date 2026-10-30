import { z } from 'zod';
import { DocumentType, ValidityStatus, RelationshipType } from '@prisma/client';
const source = z.object({ localPath:z.string().nullish(), sha256:z.string().regex(/^[a-f0-9]{64}$/).nullish(), url:z.string().optional(),
  kind:z.string().optional(), status:z.string().optional(), filename:z.string().optional(), text:z.string().optional() }).passthrough();
export const curatedRecordSchema = z.object({
  id:z.string().trim().min(1),documentNumber:z.string().min(1),normalizedNumber:z.string().min(1),
  documentType:z.nativeEnum(DocumentType),title:z.string().min(1),issuingBody:z.string().nullable(),
  validityStatus:z.nativeEnum(ValidityStatus),fullText:z.string().min(1),fullTextSha256:z.string().regex(/^[a-f0-9]{64}$/),
  scope:z.enum(['VIET_NAM','HUNG_YEN']),group:z.string().min(1),parserVersion:z.string().min(1),
  legalReview:z.literal('PENDING'),readyForAutomaticChecklist:z.literal(false),
  parseQuality:z.record(z.unknown()),structuredContent:z.record(z.unknown()),url:z.string().url(),
  contentSources:z.array(source),originalFiles:z.array(source),sourceParts:z.array(z.record(z.unknown())),
  formAttachments:z.array(source.extend({filename:z.string(),localPath:z.string(),sha256:z.string(),text:z.string()})).optional(),
  relationships:z.array(z.object({targetDocNumber:z.string(),normalizedTargetNumber:z.string().optional(),relationshipType:z.nativeEnum(RelationshipType)}).passthrough()),
}).passthrough();
export type CuratedRecord = z.infer<typeof curatedRecordSchema>;
