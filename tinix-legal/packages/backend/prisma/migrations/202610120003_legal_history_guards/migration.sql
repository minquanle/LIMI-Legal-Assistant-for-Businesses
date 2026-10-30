-- Prisma does not express CHECK constraints or append-only triggers.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

ALTER TABLE document_snapshots ADD CONSTRAINT snapshot_hashes_valid CHECK (
  "contentHash" ~ '^[0-9a-f]{64}$' AND "metadataHash" ~ '^[0-9a-f]{64}$'
  AND "contentHash" = encode(digest("fullText", 'sha256'), 'hex')
  AND length(btrim("fullText")) > 0 AND btrim("fullText") <> 'Error!'
  AND jsonb_typeof("metadataJson") = 'object' AND jsonb_typeof("qualityJson") = 'object');
ALTER TABLE imported_document_identities ADD CONSTRAINT imported_identity_not_empty CHECK (length(btrim("datasetKey"))>0 AND length(btrim("externalId"))>0);
ALTER TABLE document_sources ADD CONSTRAINT source_domain_url_pair CHECK (
  (domain IS NULL AND "normalizedUrl" IS NULL AND "sourceRecordId" IS NULL)
  OR (domain IS NOT NULL AND "normalizedUrl" IS NOT NULL
      AND domain=lower(domain) AND domain<>''
      AND substring("normalizedUrl" from '^https?://([^/:]+)') IS NOT NULL
      AND substring("normalizedUrl" from '^https?://([^/:]+)')=domain));
ALTER TABLE snapshot_sources ADD CONSTRAINT snapshot_provenance_hash_valid CHECK ("provenanceHash" ~ '^[0-9a-f]{64}$');
ALTER TABLE parse_runs ADD CONSTRAINT parse_hash_offset_valid CHECK (
  "structureHash" ~ '^[0-9a-f]{64}$' AND "offsetUnit"='UNICODE_CODE_POINT'
  AND length(btrim("parserVersion"))>0 AND jsonb_typeof("structureJson")='object');
ALTER TABLE parsed_provisions ADD CONSTRAINT provision_span_valid CHECK (
  "spanStart">=0 AND "spanEnd">="spanStart" AND "depth">=0 AND "orderIndex">=0 AND length(btrim("externalNodeId"))>0);
ALTER TABLE source_observations ADD CONSTRAINT observation_status_valid CHECK (
  ("httpStatus" IS NULL OR "httpStatus" BETWEEN 100 AND 599)
  AND ("rawHash" IS NULL OR "rawHash" ~ '^[0-9a-f]{64}$'));
ALTER TABLE object_assets ADD CONSTRAINT object_asset_valid CHECK (
  "checksum" ~ '^[0-9a-f]{64}$' AND "sizeBytes">=0 AND length(btrim(bucket))>0 AND length(btrim("objectKey"))>0);
ALTER TABLE snapshot_assets ADD CONSTRAINT asset_extracted_text_hash CHECK (
  ("extractedText" IS NULL AND "extractedTextHash" IS NULL)
  OR ("extractedText" IS NOT NULL AND "extractedTextHash" IS NOT NULL
      AND "extractedTextHash"=encode(digest("extractedText",'sha256'),'hex')));
ALTER TABLE import_files ADD CONSTRAINT import_file_valid CHECK (
  "fileHash" ~ '^[0-9a-f]{64}$' AND length(btrim("datasetKey"))>0 AND ("recordCount" IS NULL OR "recordCount">=0));
ALTER TABLE import_runs ADD CONSTRAINT import_checkpoint_valid CHECK ("lastCommittedRecordIndex">=-1);
ALTER TABLE import_record_results ADD CONSTRAINT import_result_valid CHECK (
  "recordIndex">=0 AND ("snapshotId" IS NULL OR "documentId" IS NOT NULL)
  AND ("recordHash" IS NULL OR "recordHash" ~ '^[0-9a-f]{64}$')
  AND (outcome<>'REJECTED' OR ("errorCode" IS NOT NULL AND length(btrim("errorCode"))>0)));
ALTER TABLE document_relations ADD CONSTRAINT relation_snapshot_owner_present CHECK (
  "targetSnapshotId" IS NULL OR "targetDocId" IS NOT NULL);
ALTER TABLE legal_review_decisions ADD CONSTRAINT review_evidence_present CHECK (
  length(btrim("reviewerRef"))>0 AND "evidenceJson" <> '{}'::jsonb AND "evidenceJson" <> '[]'::jsonb AND "evidenceJson" <> 'null'::jsonb);

CREATE FUNCTION limi_reject_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'LIMI_HISTORY_IMMUTABLE:%', TG_TABLE_NAME USING ERRCODE='23514';
END $$;
CREATE TRIGGER immutable_snapshot BEFORE UPDATE OR DELETE ON document_snapshots FOR EACH ROW EXECUTE FUNCTION limi_reject_history_mutation();
CREATE TRIGGER immutable_import_identity BEFORE UPDATE OR DELETE ON imported_document_identities FOR EACH ROW EXECUTE FUNCTION limi_reject_history_mutation();
CREATE TRIGGER immutable_snapshot_source BEFORE UPDATE OR DELETE ON snapshot_sources FOR EACH ROW EXECUTE FUNCTION limi_reject_history_mutation();
CREATE TRIGGER immutable_snapshot_asset BEFORE UPDATE OR DELETE ON snapshot_assets FOR EACH ROW EXECUTE FUNCTION limi_reject_history_mutation();
CREATE TRIGGER immutable_source_observation BEFORE UPDATE OR DELETE ON source_observations FOR EACH ROW EXECUTE FUNCTION limi_reject_history_mutation();
CREATE TRIGGER immutable_import_file BEFORE UPDATE OR DELETE ON import_files FOR EACH ROW EXECUTE FUNCTION limi_reject_history_mutation();
CREATE TRIGGER immutable_import_result BEFORE UPDATE OR DELETE ON import_record_results FOR EACH ROW EXECUTE FUNCTION limi_reject_history_mutation();
CREATE TRIGGER immutable_review BEFORE UPDATE OR DELETE ON legal_review_decisions FOR EACH ROW EXECUTE FUNCTION limi_reject_history_mutation();
CREATE TRIGGER immutable_provision BEFORE UPDATE OR DELETE ON parsed_provisions FOR EACH ROW EXECUTE FUNCTION limi_reject_history_mutation();

CREATE FUNCTION limi_guard_parse_run() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'LIMI_PARSE_IMMUTABLE' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' THEN
    IF NEW."sealedAt" IS NOT NULL THEN RAISE EXCEPTION 'LIMI_PARSE_MUST_START_UNSEALED' USING ERRCODE='23514'; END IF;
    RETURN NEW;
  END IF;
  IF OLD."sealedAt" IS NOT NULL OR NEW."sealedAt" IS NULL
     OR (to_jsonb(NEW)-'sealedAt') IS DISTINCT FROM (to_jsonb(OLD)-'sealedAt') THEN
    RAISE EXCEPTION 'LIMI_PARSE_IMMUTABLE' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER immutable_parse_run BEFORE INSERT OR UPDATE OR DELETE ON parse_runs FOR EACH ROW EXECUTE FUNCTION limi_guard_parse_run();

CREATE FUNCTION limi_guard_provision_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE source_length integer; sealed timestamptz; parent_node parsed_provisions%ROWTYPE;
BEGIN
  -- Lock the run: inserting nodes and sealing cannot race across transactions.
  SELECT pr."sealedAt", char_length(ds."fullText") INTO sealed, source_length
    FROM parse_runs pr JOIN document_snapshots ds ON ds.id=pr."snapshotId"
    WHERE pr.id=NEW."parseRunId" FOR UPDATE OF pr;
  IF source_length IS NULL OR sealed IS NOT NULL THEN RAISE EXCEPTION 'LIMI_PARSE_NOT_WRITABLE' USING ERRCODE='23514'; END IF;
  IF NEW."spanEnd">source_length THEN RAISE EXCEPTION 'LIMI_SPAN_OUT_OF_RANGE' USING ERRCODE='23514'; END IF;
  IF NEW."parentId" IS NOT NULL THEN
    SELECT * INTO parent_node FROM parsed_provisions WHERE id=NEW."parentId" AND "parseRunId"=NEW."parseRunId";
    IF parent_node.id IS NULL OR NEW.depth<>parent_node.depth+1 OR NEW."spanStart"<parent_node."spanStart" OR NEW."spanEnd">parent_node."spanEnd" THEN
      RAISE EXCEPTION 'LIMI_INVALID_PROVISION_PARENT' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.depth<>0 THEN RAISE EXCEPTION 'LIMI_ROOT_DEPTH_INVALID' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_provision_insert BEFORE INSERT ON parsed_provisions FOR EACH ROW EXECUTE FUNCTION limi_guard_provision_insert();

CREATE FUNCTION limi_guard_source_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."documentId"<>OLD."documentId"
     OR (OLD.domain IS NOT NULL AND (NEW.domain IS DISTINCT FROM OLD.domain OR NEW."normalizedUrl" IS DISTINCT FROM OLD."normalizedUrl"))
     OR (OLD."sourceRecordId" IS NOT NULL AND NEW."sourceRecordId" IS DISTINCT FROM OLD."sourceRecordId") THEN
    RAISE EXCEPTION 'LIMI_SOURCE_IDENTITY_CONFLICT' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_source_identity BEFORE UPDATE ON document_sources FOR EACH ROW EXECUTE FUNCTION limi_guard_source_identity();

CREATE FUNCTION limi_guard_asset_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.bucket,NEW."objectKey",NEW.checksum,NEW."sizeBytes",NEW."mimeType") IS DISTINCT FROM
     (OLD.bucket,OLD."objectKey",OLD.checksum,OLD."sizeBytes",OLD."mimeType") THEN
    RAISE EXCEPTION 'LIMI_ASSET_IDENTITY_CONFLICT' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_asset_identity BEFORE UPDATE ON object_assets FOR EACH ROW EXECUTE FUNCTION limi_guard_asset_identity();

CREATE FUNCTION limi_guard_import_checkpoint() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."lastCommittedRecordIndex"<OLD."lastCommittedRecordIndex" OR NEW."fileId"<>OLD."fileId" OR NEW."importerVersion"<>OLD."importerVersion" OR NEW.mode<>OLD.mode THEN
    RAISE EXCEPTION 'LIMI_IMPORT_PROGRESS_CONFLICT' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_import_checkpoint BEFORE UPDATE ON import_runs FOR EACH ROW EXECUTE FUNCTION limi_guard_import_checkpoint();
