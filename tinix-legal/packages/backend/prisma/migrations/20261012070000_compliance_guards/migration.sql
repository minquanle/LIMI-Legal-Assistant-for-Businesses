CREATE FUNCTION compliance_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Immutable compliance record'; END $$;
CREATE TRIGGER obligation_review_immutable BEFORE UPDATE OR DELETE ON "ObligationReview" FOR EACH ROW EXECUTE FUNCTION compliance_immutable();
CREATE TRIGGER compliance_decision_immutable BEFORE UPDATE OR DELETE ON "ComplianceDecision" FOR EACH ROW EXECUTE FUNCTION compliance_immutable();
CREATE TRIGGER task_history_immutable BEFORE UPDATE OR DELETE ON "ComplianceTaskHistory" FOR EACH ROW EXECUTE FUNCTION compliance_immutable();
CREATE FUNCTION obligation_version_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' THEN
   IF NEW.status<>'DRAFT' OR NEW."publishedAt" IS NOT NULL OR NEW."retiredAt" IS NOT NULL THEN RAISE EXCEPTION 'New versions must start as drafts'; END IF;
   RETURN NEW;
 END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Obligation versions must be retained'; END IF;
 IF ROW(NEW."obligationId",NEW.version,NEW."authorId",NEW."createdAt") IS DISTINCT FROM ROW(OLD."obligationId",OLD.version,OLD."authorId",OLD."createdAt") THEN RAISE EXCEPTION 'Immutable identity'; END IF;
 IF OLD.status <> 'DRAFT' AND NEW."contentJson" IS DISTINCT FROM OLD."contentJson" THEN RAISE EXCEPTION 'Only drafts may be edited'; END IF;
 IF NEW.status<>OLD.status AND NOT (OLD.status='DRAFT' AND NEW.status='IN_REVIEW' OR OLD.status='IN_REVIEW' AND NEW.status IN ('DRAFT','PUBLISHED') OR OLD.status='PUBLISHED' AND NEW.status='RETIRED') THEN RAISE EXCEPTION 'Invalid obligation transition'; END IF;
 IF OLD.status='RETIRED' OR OLD.status='PUBLISHED' AND NOT (NEW.status='RETIRED' AND NEW."publishedAt"=OLD."publishedAt") THEN RAISE EXCEPTION 'Published versions are immutable'; END IF;
 IF NEW.status='PUBLISHED' AND NOT EXISTS(SELECT 1 FROM "ObligationReview" WHERE "versionId"=OLD.id AND decision='APPROVE') THEN RAISE EXCEPTION 'Approval required'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER obligation_version_guard BEFORE INSERT OR UPDATE OR DELETE ON "ObligationVersion" FOR EACH ROW EXECUTE FUNCTION obligation_version_guard();
CREATE FUNCTION obligation_citation_guard() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE target text; state text; BEGIN
 target:=CASE WHEN TG_OP='DELETE' THEN OLD."versionId" ELSE NEW."versionId" END;
 SELECT status INTO state FROM "ObligationVersion" WHERE id=target FOR UPDATE;
 IF state <> 'DRAFT' THEN RAISE EXCEPTION 'Only draft citations may be edited'; END IF;
 IF TG_OP='UPDATE' AND NEW."versionId"<>OLD."versionId" THEN RAISE EXCEPTION 'Citation cannot be moved'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END; END $$;
CREATE TRIGGER obligation_citation_guard BEFORE INSERT OR UPDATE OR DELETE ON "ObligationCitation" FOR EACH ROW EXECUTE FUNCTION obligation_citation_guard();
CREATE FUNCTION catalogue_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR OLD."sealedAt" IS NOT NULL OR NEW."sealedAt" IS NULL OR ROW(NEW.id,NEW.name,NEW."publishedAt",NEW."actorId",NEW."manifestHash") IS DISTINCT FROM ROW(OLD.id,OLD.name,OLD."publishedAt",OLD."actorId",OLD."manifestHash") THEN RAISE EXCEPTION 'Immutable catalogue release'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "CatalogueReleaseItem" WHERE "releaseId"=OLD.id) THEN RAISE EXCEPTION 'Empty release'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER catalogue_guard BEFORE UPDATE OR DELETE ON "CatalogueRelease" FOR EACH ROW EXECUTE FUNCTION catalogue_guard();
CREATE FUNCTION catalogue_item_guard() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE sealed timestamptz; BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Immutable catalogue item'; END IF;
 SELECT "sealedAt" INTO sealed FROM "CatalogueRelease" WHERE id=NEW."releaseId" FOR UPDATE;
 IF sealed IS NOT NULL OR NOT EXISTS(SELECT 1 FROM "ObligationVersion" WHERE id=NEW."versionId" AND status='PUBLISHED') THEN RAISE EXCEPTION 'Invalid release item'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER catalogue_item_guard BEFORE INSERT OR UPDATE OR DELETE ON "CatalogueReleaseItem" FOR EACH ROW EXECUTE FUNCTION catalogue_item_guard();
CREATE FUNCTION evaluation_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR ROW(NEW."companyId",NEW."profileVersionId",NEW."releaseId",NEW."asOfDate",NEW."engineVersion",NEW."inputHash",NEW."contextJson") IS DISTINCT FROM ROW(OLD."companyId",OLD."profileVersionId",OLD."releaseId",OLD."asOfDate",OLD."engineVersion",OLD."inputHash",OLD."contextJson") OR OLD.status='COMPLETED' THEN RAISE EXCEPTION 'Immutable evaluation inputs/results'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER evaluation_guard BEFORE UPDATE OR DELETE ON "ComplianceEvaluation" FOR EACH ROW EXECUTE FUNCTION evaluation_guard();
ALTER TABLE "ComplianceOutbox" ADD CONSTRAINT compliance_outbox_evaluation_fk FOREIGN KEY("evaluationId") REFERENCES "ComplianceEvaluation"(id) ON DELETE RESTRICT;
ALTER TABLE "ComplianceTask" ADD CONSTRAINT compliance_task_decision_fk FOREIGN KEY("decisionId") REFERENCES "ComplianceDecision"(id) ON DELETE RESTRICT;
ALTER TABLE "ComplianceTask" ADD CONSTRAINT compliance_task_assignee_fk FOREIGN KEY("assigneeId") REFERENCES "WorkspaceUser"(id) ON DELETE RESTRICT;
ALTER TABLE "ObligationVersion" ADD CONSTRAINT obligation_status_check CHECK (status IN ('DRAFT','IN_REVIEW','PUBLISHED','RETIRED'));
ALTER TABLE "ComplianceTask" ADD CONSTRAINT task_status_check CHECK (status IN ('TODO','DOING','DONE'));
