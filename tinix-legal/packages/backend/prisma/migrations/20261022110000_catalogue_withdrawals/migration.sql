-- A sealed empty catalogue is an explicit withdrawal of all active obligations.
-- Preserve every identity and immutability guard on existing sealed releases.
CREATE OR REPLACE FUNCTION catalogue_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR OLD."sealedAt" IS NOT NULL OR NEW."sealedAt" IS NULL OR ROW(NEW.id,NEW.name,NEW."publishedAt",NEW."actorId",NEW."manifestHash") IS DISTINCT FROM ROW(OLD.id,OLD.name,OLD."publishedAt",OLD."actorId",OLD."manifestHash") THEN RAISE EXCEPTION 'Immutable catalogue release'; END IF;
 IF NOT EXISTS(SELECT 1 FROM "CatalogueReleaseItem" WHERE "releaseId"=OLD.id) AND
  (NEW."manifestHash"<>'4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945' OR EXISTS(SELECT 1 FROM "ObligationVersion" WHERE status='PUBLISHED')) THEN RAISE EXCEPTION 'Empty release requires withdrawal of every published obligation'; END IF;
 RETURN NEW; END $$;
