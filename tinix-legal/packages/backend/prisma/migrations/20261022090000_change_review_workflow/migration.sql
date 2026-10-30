-- Intermediate review steps while a candidate is still PENDING. status/approval guards are unchanged:
-- the existing change_candidate_guard compares only the observed fields, so stage/workflowJson stay editable until a final decision.
ALTER TABLE "LawChangeCandidate" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE "LawChangeCandidate" ADD COLUMN "workflowJson" JSONB;
ALTER TABLE "LawChangeCandidate" ADD CONSTRAINT "LawChangeCandidate_stage_check" CHECK (stage IN ('NEW','OBLIGATION_UPDATE','NEEDS_IMPORT'));
