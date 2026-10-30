ALTER TABLE "PilotChecklistProgress" ADD COLUMN "reviewJson" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ComplianceTask" ADD COLUMN "reviewJson" JSONB NOT NULL DEFAULT '{}';
