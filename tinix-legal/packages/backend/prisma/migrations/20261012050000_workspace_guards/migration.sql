-- Business history is append-only; credentials never belong in audit rows.
CREATE FUNCTION workspace_history_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Workspace history is immutable'; END $$;
CREATE TRIGGER workspace_profile_immutable BEFORE UPDATE OR DELETE ON "WorkspaceProfileVersion" FOR EACH ROW EXECUTE FUNCTION workspace_history_immutable();
CREATE TRIGGER workspace_audit_immutable BEFORE UPDATE OR DELETE ON "WorkspaceAudit" FOR EACH ROW EXECUTE FUNCTION workspace_history_immutable();
CREATE TRIGGER workspace_event_immutable BEFORE UPDATE OR DELETE ON "WorkspaceCompanyEvent" FOR EACH ROW EXECUTE FUNCTION workspace_history_immutable();
CREATE TRIGGER workspace_registry_immutable BEFORE UPDATE OR DELETE ON "WorkspaceRegistryObservation" FOR EACH ROW EXECUTE FUNCTION workspace_history_immutable();
ALTER TABLE "WorkspaceCompany" ADD CONSTRAINT workspace_company_version_positive CHECK (version > 0);
ALTER TABLE "WorkspaceProfileVersion" ADD CONSTRAINT workspace_profile_version_positive CHECK (version > 0);
ALTER TABLE "WorkspaceSite" ADD CONSTRAINT workspace_site_version_positive CHECK (version > 0);
ALTER TABLE "WorkspaceAccessToken" ADD CONSTRAINT workspace_token_kind CHECK (kind IN ('PILOT','RESET','INVITE'));
