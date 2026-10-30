-- CreateTable
CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Obligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligationVersion" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "contentJson" JSONB NOT NULL,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObligationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligationCitation" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "snapshotId" UUID NOT NULL,
    "parseRunId" UUID NOT NULL,
    "provisionId" UUID NOT NULL,
    "quote" TEXT NOT NULL,
    "ocrVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ObligationCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligationReview" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "checksJson" JSONB NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObligationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalCandidate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "snapshotId" UUID NOT NULL,
    "parseRunId" UUID NOT NULL,
    "provisionId" UUID NOT NULL,
    "groupCode" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "reasonJson" JSONB NOT NULL,
    "draftVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueRelease" (
    "id" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manifestHash" TEXT NOT NULL,
    "sealedAt" TIMESTAMP(3),

    CONSTRAINT "CatalogueRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueReleaseItem" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,

    CONSTRAINT "CatalogueReleaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceEvaluation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "profileVersionId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "asOfDate" DATE NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "contextJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ComplianceEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceDecision" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "missingFacts" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "dueDate" DATE,
    "deadlineKind" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,

    CONSTRAINT "ComplianceDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceOutbox" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceTask" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "basisVersionId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "applicability" TEXT NOT NULL,
    "assigneeId" TEXT,
    "dueDate" DATE,
    "dueDateKind" TEXT NOT NULL,
    "missingFacts" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "stepsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceTaskHistory" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB NOT NULL,
    "afterJson" JSONB NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceTaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceEvidence" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "basisVersionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadHash" TEXT NOT NULL,
    "uploadExpiresAt" TIMESTAMP(3) NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "availableAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,

    CONSTRAINT "ComplianceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Obligation_key_key" ON "Obligation"("key");

-- CreateIndex
CREATE INDEX "ObligationVersion_status_createdAt_idx" ON "ObligationVersion"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ObligationVersion_obligationId_version_key" ON "ObligationVersion"("obligationId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ObligationCitation_versionId_provisionId_key" ON "ObligationCitation"("versionId", "provisionId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalCandidate_key_key" ON "LegalCandidate"("key");

-- CreateIndex
CREATE INDEX "LegalCandidate_groupCode_score_idx" ON "LegalCandidate"("groupCode", "score");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueReleaseItem_releaseId_versionId_key" ON "CatalogueReleaseItem"("releaseId", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceEvaluation_companyId_profileVersionId_releaseId_a_key" ON "ComplianceEvaluation"("companyId", "profileVersionId", "releaseId", "asOfDate", "engineVersion", "inputHash");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceDecision_evaluationId_versionId_scopeKey_key" ON "ComplianceDecision"("evaluationId", "versionId", "scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceOutbox_evaluationId_key" ON "ComplianceOutbox"("evaluationId");

-- CreateIndex
CREATE INDEX "ComplianceTask_companyId_status_dueDate_idx" ON "ComplianceTask"("companyId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceTask_companyId_obligationId_scopeKey_periodKey_key" ON "ComplianceTask"("companyId", "obligationId", "scopeKey", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceEvidence_objectKey_key" ON "ComplianceEvidence"("objectKey");

-- CreateIndex
CREATE INDEX "ComplianceEvidence_state_uploadExpiresAt_idx" ON "ComplianceEvidence"("state", "uploadExpiresAt");

-- AddForeignKey
ALTER TABLE "ObligationVersion" ADD CONSTRAINT "ObligationVersion_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationCitation" ADD CONSTRAINT "ObligationCitation_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ObligationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationCitation" ADD CONSTRAINT "ObligationCitation_documentId_snapshotId_fkey" FOREIGN KEY ("documentId", "snapshotId") REFERENCES "document_snapshots"("documentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationCitation" ADD CONSTRAINT "ObligationCitation_snapshotId_parseRunId_fkey" FOREIGN KEY ("snapshotId", "parseRunId") REFERENCES "parse_runs"("snapshotId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ObligationCitation" ADD CONSTRAINT "ObligationCitation_parseRunId_provisionId_fkey" FOREIGN KEY ("parseRunId", "provisionId") REFERENCES "parsed_provisions"("parseRunId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ObligationReview" ADD CONSTRAINT "ObligationReview_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ObligationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueReleaseItem" ADD CONSTRAINT "CatalogueReleaseItem_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CatalogueRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueReleaseItem" ADD CONSTRAINT "CatalogueReleaseItem_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ObligationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceEvaluation" ADD CONSTRAINT "ComplianceEvaluation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "WorkspaceCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceEvaluation" ADD CONSTRAINT "ComplianceEvaluation_profileVersionId_fkey" FOREIGN KEY ("profileVersionId") REFERENCES "WorkspaceProfileVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceEvaluation" ADD CONSTRAINT "ComplianceEvaluation_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CatalogueRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDecision" ADD CONSTRAINT "ComplianceDecision_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ComplianceEvaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDecision" ADD CONSTRAINT "ComplianceDecision_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ObligationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTask" ADD CONSTRAINT "ComplianceTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "WorkspaceCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTask" ADD CONSTRAINT "ComplianceTask_basisVersionId_fkey" FOREIGN KEY ("basisVersionId") REFERENCES "ObligationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTaskHistory" ADD CONSTRAINT "ComplianceTaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ComplianceTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceEvidence" ADD CONSTRAINT "ComplianceEvidence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ComplianceTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceEvidence" ADD CONSTRAINT "ComplianceEvidence_basisVersionId_fkey" FOREIGN KEY ("basisVersionId") REFERENCES "ObligationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
