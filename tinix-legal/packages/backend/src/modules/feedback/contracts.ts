import {z} from 'zod';
export const feedbackCategories=['NOT_RELEVANT','UNCLEAR','CONTENT','DEADLINE','TECHNICAL','OTHER'] as const;
export const feedbackStatuses=['OPEN','IN_REVIEW','RESOLVED','DECLINED'] as const;
const body=z.string().trim().min(3).max(4000);
export const feedbackCreate=z.object({requestId:z.string().uuid(),taskId:z.string().uuid().optional(),category:z.enum(feedbackCategories),title:z.string().trim().min(3).max(250).optional(),body}).strict();
export const feedbackReply=z.object({requestId:z.string().uuid(),expectedRevision:z.number().int().positive(),body}).strict();
export const feedbackReview=feedbackReply.extend({status:z.enum(feedbackStatuses)});
export const feedbackQuery=z.object({page:z.coerce.number().int().min(0).max(10000).default(0),status:z.enum(['all',...feedbackStatuses]).default('all'),category:z.enum(['all',...feedbackCategories]).default('all'),q:z.string().trim().max(200).default('')});
