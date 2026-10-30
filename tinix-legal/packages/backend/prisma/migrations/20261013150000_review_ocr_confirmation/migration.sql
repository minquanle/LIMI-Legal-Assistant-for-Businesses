CREATE OR REPLACE FUNCTION obligation_citation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; state text;
BEGIN
  target := CASE WHEN TG_OP = 'DELETE' THEN OLD."versionId" ELSE NEW."versionId" END;
  SELECT status INTO state FROM "ObligationVersion" WHERE id = target FOR UPDATE;

  IF TG_OP = 'UPDATE' AND state = 'IN_REVIEW'
    AND OLD."ocrVerified" = false AND NEW."ocrVerified" = true
    AND ROW(NEW.id, NEW."versionId", NEW."documentId", NEW."snapshotId", NEW."parseRunId", NEW."provisionId", NEW.quote)
      IS NOT DISTINCT FROM
        ROW(OLD.id, OLD."versionId", OLD."documentId", OLD."snapshotId", OLD."parseRunId", OLD."provisionId", OLD.quote)
  THEN
    RETURN NEW;
  END IF;

  IF state <> 'DRAFT' THEN RAISE EXCEPTION 'Only draft citations may be edited'; END IF;
  IF TG_OP = 'UPDATE' AND NEW."versionId" <> OLD."versionId" THEN RAISE EXCEPTION 'Citation cannot be moved'; END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
