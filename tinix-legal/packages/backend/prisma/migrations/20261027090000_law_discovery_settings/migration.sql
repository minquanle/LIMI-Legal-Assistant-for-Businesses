-- Reviewer-managed discovery of new legal documents. Defaults keep discovery OFF until a reviewer enables it.
CREATE TABLE "LawDiscoverySetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "intervalHours" INTEGER NOT NULL DEFAULT 24,
    "maxPerRun" INTEGER NOT NULL DEFAULT 20,
    "effectiveFrom" DATE,
    "updatedBy" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LawDiscoverySetting_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LawDiscoverySetting_single_row" CHECK ("id" = 'default'),
    CONSTRAINT "LawDiscoverySetting_interval" CHECK ("intervalHours" IN (1, 3, 24)),
    CONSTRAINT "LawDiscoverySetting_max_per_run" CHECK ("maxPerRun" BETWEEN 1 AND 200)
);
