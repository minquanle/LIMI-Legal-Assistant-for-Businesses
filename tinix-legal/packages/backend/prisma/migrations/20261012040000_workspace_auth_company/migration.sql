-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "WorkspaceUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "platformReviewer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,

    CONSTRAINT "WorkspaceMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceAccessToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "role" "WorkspaceRole",
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "WorkspaceAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceCompany" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "profileJson" JSONB NOT NULL,
    "factsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceProfileVersion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "profileJson" JSONB NOT NULL,
    "factsJson" JSONB NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceProfileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceSite" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceCompanyEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredOn" DATE NOT NULL,
    "note" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceCompanyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceAudit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceLoginThrottle" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceLoginThrottle_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "WorkspaceRegistryObservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "profileJson" JSONB NOT NULL,
    "provenanceJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceRegistryObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceUser_email_key" ON "WorkspaceUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMembership_userId_organizationId_key" ON "WorkspaceMembership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceSession_tokenHash_key" ON "WorkspaceSession"("tokenHash");

-- CreateIndex
CREATE INDEX "WorkspaceSession_userId_expiresAt_idx" ON "WorkspaceSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceAccessToken_tokenHash_key" ON "WorkspaceAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "WorkspaceCompany_organizationId_updatedAt_idx" ON "WorkspaceCompany"("organizationId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceCompany_organizationId_taxId_key" ON "WorkspaceCompany"("organizationId", "taxId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceProfileVersion_companyId_version_key" ON "WorkspaceProfileVersion"("companyId", "version");

-- CreateIndex
CREATE INDEX "WorkspaceSite_companyId_idx" ON "WorkspaceSite"("companyId");

-- CreateIndex
CREATE INDEX "WorkspaceCompanyEvent_companyId_occurredOn_idx" ON "WorkspaceCompanyEvent"("companyId", "occurredOn");

-- CreateIndex
CREATE INDEX "WorkspaceAudit_organizationId_createdAt_idx" ON "WorkspaceAudit"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceRegistryObservation_userId_taxId_idx" ON "WorkspaceRegistryObservation"("userId", "taxId");

-- AddForeignKey
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WorkspaceUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WorkspaceOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceSession" ADD CONSTRAINT "WorkspaceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WorkspaceUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceAccessToken" ADD CONSTRAINT "WorkspaceAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WorkspaceUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceAccessToken" ADD CONSTRAINT "WorkspaceAccessToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WorkspaceOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceCompany" ADD CONSTRAINT "WorkspaceCompany_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WorkspaceOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceProfileVersion" ADD CONSTRAINT "WorkspaceProfileVersion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "WorkspaceCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceSite" ADD CONSTRAINT "WorkspaceSite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "WorkspaceCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceCompanyEvent" ADD CONSTRAINT "WorkspaceCompanyEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "WorkspaceCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceAudit" ADD CONSTRAINT "WorkspaceAudit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "WorkspaceOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
