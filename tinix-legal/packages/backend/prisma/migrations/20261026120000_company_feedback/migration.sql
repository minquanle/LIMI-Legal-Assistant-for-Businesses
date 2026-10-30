CREATE TABLE "WorkspaceFeedback" (
 "id" TEXT PRIMARY KEY,"companyId" TEXT NOT NULL REFERENCES "WorkspaceCompany"("id") ON DELETE RESTRICT,
 "taskId" TEXT REFERENCES "ComplianceTask"("id") ON DELETE RESTRICT,"creatorId" TEXT NOT NULL REFERENCES "WorkspaceUser"("id") ON DELETE RESTRICT,
 "requestId" TEXT NOT NULL,"category" TEXT NOT NULL,"title" TEXT NOT NULL,"contextJson" JSONB NOT NULL DEFAULT '{}',
 "status" TEXT NOT NULL DEFAULT 'OPEN',"revision" INTEGER NOT NULL DEFAULT 1,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT feedback_category_check CHECK ("category" IN ('NOT_RELEVANT','UNCLEAR','CONTENT','DEADLINE','TECHNICAL','OTHER')),
 CONSTRAINT feedback_status_check CHECK ("status" IN ('OPEN','IN_REVIEW','RESOLVED','DECLINED')),
 CONSTRAINT feedback_revision_check CHECK ("revision">0),
 CONSTRAINT feedback_title_check CHECK (length("title") BETWEEN 3 AND 250)
);
CREATE UNIQUE INDEX "WorkspaceFeedback_companyId_requestId_key" ON "WorkspaceFeedback"("companyId","requestId");
CREATE INDEX "WorkspaceFeedback_companyId_updatedAt_id_idx" ON "WorkspaceFeedback"("companyId","updatedAt","id");
CREATE INDEX "WorkspaceFeedback_status_updatedAt_id_idx" ON "WorkspaceFeedback"("status","updatedAt","id");
CREATE TABLE "WorkspaceFeedbackMessage" (
 "id" TEXT PRIMARY KEY,"feedbackId" TEXT NOT NULL REFERENCES "WorkspaceFeedback"("id") ON DELETE RESTRICT,
 "authorId" TEXT NOT NULL REFERENCES "WorkspaceUser"("id") ON DELETE RESTRICT,"requestId" TEXT NOT NULL,
 "actorRole" TEXT NOT NULL,"body" TEXT NOT NULL,"statusAfter" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT feedback_role_check CHECK ("actorRole" IN ('COMPANY','REVIEWER')),
 CONSTRAINT feedback_body_check CHECK (length("body") BETWEEN 3 AND 4000),
 CONSTRAINT feedback_message_status_check CHECK ("statusAfter" IN ('OPEN','IN_REVIEW','RESOLVED','DECLINED'))
);
CREATE UNIQUE INDEX "WorkspaceFeedbackMessage_feedbackId_requestId_key" ON "WorkspaceFeedbackMessage"("feedbackId","requestId");
CREATE INDEX "WorkspaceFeedbackMessage_feedbackId_createdAt_id_idx" ON "WorkspaceFeedbackMessage"("feedbackId","createdAt","id");
CREATE FUNCTION feedback_context_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' AND ROW(NEW."companyId",NEW."taskId",NEW."creatorId",NEW."requestId",NEW.category,NEW.title,NEW."contextJson",NEW."createdAt") IS DISTINCT FROM ROW(OLD."companyId",OLD."taskId",OLD."creatorId",OLD."requestId",OLD.category,OLD.title,OLD."contextJson",OLD."createdAt") THEN RAISE EXCEPTION 'Feedback context is immutable'; END IF;
 IF NEW."taskId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "ComplianceTask" WHERE id=NEW."taskId" AND "companyId"=NEW."companyId") THEN RAISE EXCEPTION 'Feedback task belongs to another company'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER feedback_context_immutable BEFORE INSERT OR UPDATE ON "WorkspaceFeedback" FOR EACH ROW EXECUTE FUNCTION feedback_context_guard();
CREATE TRIGGER feedback_message_immutable BEFORE UPDATE OR DELETE ON "WorkspaceFeedbackMessage" FOR EACH ROW EXECUTE FUNCTION workspace_history_immutable();
