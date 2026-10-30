-- CreateTable
CREATE TABLE "WorkspaceAlert" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "taskId" TEXT,
    "decisionId" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertUserState" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),

    CONSTRAINT "AlertUserState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertOutbox" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "outboxId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyReminderSetting" (
    "companyId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "preparationDays" INTEGER NOT NULL DEFAULT 7,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyReminderSetting_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "SourceWatch" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "sourceId" TEXT,
    "documentId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "nextCheckAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intervalHours" INTEGER NOT NULL DEFAULT 24,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "baselineId" TEXT,
    "etag" TEXT,
    "lastModified" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlDomainState" (
    "domain" TEXT NOT NULL,
    "nextRequestAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "robotsText" TEXT,
    "robotsCheckedAt" TIMESTAMP(3),
    "watermark" TIMESTAMP(3),

    CONSTRAINT "CrawlDomainState_pkey" PRIMARY KEY ("domain")
);

-- CreateTable
CREATE TABLE "WatchObservation" (
    "id" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "httpStatus" INTEGER,
    "result" TEXT NOT NULL,
    "rawHash" TEXT,
    "contentHash" TEXT,
    "metadataHash" TEXT,
    "relationHash" TEXT,
    "parserVersion" TEXT NOT NULL,
    "extractedJson" JSONB NOT NULL,

    CONSTRAINT "WatchObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawChangeCandidate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "watchId" TEXT,
    "observationId" TEXT,
    "previousObservationId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "diffJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawChangeCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovedLawChange" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "whatChanged" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "versionIds" JSONB NOT NULL,
    "citationsJson" JSONB NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovedLawChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeCompanyImpact" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "evaluationId" TEXT,
    "completedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeCompanyImpact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceAlert_key_key" ON "WorkspaceAlert"("key");

-- CreateIndex
CREATE INDEX "WorkspaceAlert_companyId_createdAt_idx" ON "WorkspaceAlert"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlertUserState_alertId_userId_key" ON "AlertUserState"("alertId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertOutbox_alertId_key" ON "AlertOutbox"("alertId");

-- CreateIndex
CREATE INDEX "AlertOutbox_deliveredAt_nextAttemptAt_idx" ON "AlertOutbox"("deliveredAt", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlertDeliveryAttempt_outboxId_attempt_key" ON "AlertDeliveryAttempt"("outboxId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "SourceWatch_url_key" ON "SourceWatch"("url");

-- CreateIndex
CREATE INDEX "SourceWatch_enabled_nextCheckAt_idx" ON "SourceWatch"("enabled", "nextCheckAt");

-- CreateIndex
CREATE INDEX "WatchObservation_watchId_observedAt_idx" ON "WatchObservation"("watchId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LawChangeCandidate_key_key" ON "LawChangeCandidate"("key");

-- CreateIndex
CREATE INDEX "LawChangeCandidate_status_createdAt_idx" ON "LawChangeCandidate"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovedLawChange_candidateId_key" ON "ApprovedLawChange"("candidateId");

-- CreateIndex
CREATE INDEX "ChangeCompanyImpact_completedAt_nextAttemptAt_idx" ON "ChangeCompanyImpact"("completedAt", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeCompanyImpact_eventId_companyId_key" ON "ChangeCompanyImpact"("eventId", "companyId");
