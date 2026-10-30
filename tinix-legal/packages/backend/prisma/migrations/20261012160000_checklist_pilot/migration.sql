CREATE TABLE "ChecklistImportEntry" (
 "id" TEXT NOT NULL PRIMARY KEY, "key" TEXT NOT NULL, "batchKey" TEXT NOT NULL,
 "payloadHash" TEXT NOT NULL, "versionId" TEXT, "previewEnabled" BOOLEAN NOT NULL DEFAULT false,
 "notesJson" JSONB NOT NULL, "blockedJson" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ChecklistImportEntry_key_key" ON "ChecklistImportEntry"("key");
CREATE UNIQUE INDEX "ChecklistImportEntry_versionId_key" ON "ChecklistImportEntry"("versionId");
CREATE INDEX "ChecklistImportEntry_batchKey_idx" ON "ChecklistImportEntry"("batchKey");
ALTER TABLE "ChecklistImportEntry" ADD CONSTRAINT "ChecklistImportEntry_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ObligationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "PilotChecklistProgress" (
 "id" TEXT NOT NULL PRIMARY KEY, "companyId" TEXT NOT NULL, "versionId" TEXT NOT NULL,
 "basisHash" TEXT NOT NULL, "revision" INTEGER NOT NULL DEFAULT 1, "status" TEXT NOT NULL DEFAULT 'TODO',
 "stepsJson" JSONB NOT NULL DEFAULT '[]', "note" TEXT NOT NULL DEFAULT '', "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "PilotChecklistProgress_companyId_versionId_key" ON "PilotChecklistProgress"("companyId", "versionId");
ALTER TABLE "PilotChecklistProgress" ADD CONSTRAINT "PilotChecklistProgress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "WorkspaceCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PilotChecklistProgress" ADD CONSTRAINT "PilotChecklistProgress_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ObligationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
