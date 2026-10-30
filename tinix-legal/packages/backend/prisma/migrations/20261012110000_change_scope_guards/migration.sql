CREATE FUNCTION change_impact_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR OLD."completedAt" IS NOT NULL OR ROW(NEW."eventId",NEW."companyId",NEW."createdAt") IS DISTINCT FROM ROW(OLD."eventId",OLD."companyId",OLD."createdAt") OR OLD."evaluationId" IS NOT NULL AND NEW."evaluationId" IS DISTINCT FROM OLD."evaluationId" THEN RAISE EXCEPTION 'Immutable impact identity/input'; END IF;
 IF NEW."evaluationId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "ComplianceEvaluation" e JOIN "ApprovedLawChange" c ON c.id=NEW."eventId" WHERE e.id=NEW."evaluationId" AND e."companyId"=NEW."companyId" AND e."releaseId"=c."releaseId" AND e."asOfDate"=c."effectiveDate") THEN RAISE EXCEPTION 'Invalid impact evaluation'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER change_impact_guard BEFORE UPDATE OR DELETE ON "ChangeCompanyImpact" FOR EACH ROW EXECUTE FUNCTION change_impact_guard();
CREATE FUNCTION alert_outbox_required() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "AlertOutbox" WHERE "alertId"=NEW.id) THEN RAISE EXCEPTION 'Alert requires atomic outbox'; END IF; RETURN NEW; END $$;
CREATE CONSTRAINT TRIGGER alert_outbox_required AFTER INSERT ON "WorkspaceAlert" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION alert_outbox_required();
CREATE FUNCTION alert_user_scope_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "WorkspaceAlert" a JOIN "WorkspaceCompany" c ON c.id=a."companyId" JOIN "WorkspaceMembership" m ON m."organizationId"=c."organizationId" WHERE a.id=NEW."alertId" AND m."userId"=NEW."userId") THEN RAISE EXCEPTION 'Alert user outside workspace'; END IF; RETURN NEW; END $$;
CREATE TRIGGER alert_user_scope_guard BEFORE INSERT OR UPDATE ON "AlertUserState" FOR EACH ROW EXECUTE FUNCTION alert_user_scope_guard();
CREATE FUNCTION watch_scope_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='UPDATE' AND ROW(NEW.url,NEW.domain,NEW.mode,NEW."sourceId",NEW."documentId") IS DISTINCT FROM ROW(OLD.url,OLD.domain,OLD.mode,OLD."sourceId",OLD."documentId") THEN RAISE EXCEPTION 'Immutable watch identity'; END IF;
 IF NEW."baselineId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "WatchObservation" WHERE id=NEW."baselineId" AND "watchId"=NEW.id AND result IN ('TEXT','METADATA_ONLY','ATTACHMENT_HASH')) THEN RAISE EXCEPTION 'Invalid watch baseline'; END IF;
 IF NEW."sourceId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM document_sources WHERE id=NEW."sourceId" AND "documentId"=NEW."documentId") THEN RAISE EXCEPTION 'Source outside watched document'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER watch_scope_guard BEFORE INSERT OR UPDATE ON "SourceWatch" FOR EACH ROW EXECUTE FUNCTION watch_scope_guard();
