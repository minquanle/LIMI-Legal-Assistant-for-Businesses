ALTER TABLE "ComplianceEvidence" ADD CONSTRAINT evidence_metadata_valid CHECK (
 "sizeBytes">0 AND "sizeBytes"<=10485760 AND checksum ~ '^[a-f0-9]{64}$'
 AND state IN ('PENDING','UPLOADING','UPLOADED','AVAILABLE','FAILED','ABANDONING','ABANDONED'));
CREATE FUNCTION evidence_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'PENDING' OR NEW."uploadedAt" IS NOT NULL OR NEW."availableAt" IS NOT NULL THEN RAISE EXCEPTION 'New evidence must start pending'; END IF;
  RETURN NEW;
 END IF;
 IF TG_OP='DELETE' OR OLD.state='AVAILABLE' OR ROW(NEW."taskId",NEW."basisVersionId",NEW.filename,NEW."mimeType",NEW."sizeBytes",NEW.checksum,NEW."objectKey",NEW.bucket,NEW."actorId",NEW."createdAt") IS DISTINCT FROM ROW(OLD."taskId",OLD."basisVersionId",OLD.filename,OLD."mimeType",OLD."sizeBytes",OLD.checksum,OLD."objectKey",OLD.bucket,OLD."actorId",OLD."createdAt") THEN RAISE EXCEPTION 'Immutable evidence identity or verified file'; END IF;
 IF NEW.state='AVAILABLE' AND (OLD.state<>'UPLOADED' OR NEW."uploadedAt" IS NULL OR NEW."availableAt" IS NULL) THEN RAISE EXCEPTION 'Evidence must be uploaded and verified before completion'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER evidence_guard BEFORE INSERT OR UPDATE OR DELETE ON "ComplianceEvidence" FOR EACH ROW EXECUTE FUNCTION evidence_guard();
CREATE FUNCTION task_scope_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "ComplianceDecision" d JOIN "ComplianceEvaluation" e ON e.id=d."evaluationId" JOIN "ObligationVersion" v ON v.id=d."versionId" WHERE d.id=NEW."decisionId" AND e."companyId"=NEW."companyId" AND v.id=NEW."basisVersionId" AND v."obligationId"=NEW."obligationId" AND d."scopeKey"=NEW."scopeKey" AND d."periodKey"=NEW."periodKey") THEN RAISE EXCEPTION 'Task scope does not match its evaluation'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER task_scope_guard BEFORE INSERT OR UPDATE ON "ComplianceTask" FOR EACH ROW EXECUTE FUNCTION task_scope_guard();
