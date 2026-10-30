-- CreateEnum
CREATE TYPE "LegalScope" AS ENUM ('NATIONAL', 'HUNG_YEN', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LegalReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LegalSourceKind" AS ENUM ('OFFICIAL', 'REPUBLISHED', 'DATASET', 'OTHER');

-- CreateEnum
CREATE TYPE "SnapshotSourceRole" AS ENUM ('METADATA', 'CONTENT', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "SnapshotReason" AS ENUM ('INITIAL_IMPORT', 'SOURCE_CHANGE', 'TEXT_CORRECTION', 'METADATA_CORRECTION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LegalRelationOrigin" AS ENUM ('LEGACY', 'SOURCE_METADATA', 'TEXT_EXTRACTION', 'EXPERT');

-- CreateEnum
CREATE TYPE "LegalResolveStatus" AS ENUM ('UNRESOLVED', 'CANDIDATE', 'RESOLVED', 'AMBIGUOUS');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'AVAILABLE', 'FAILED');

-- CreateEnum
CREATE TYPE "SnapshotAssetRole" AS ENUM ('RAW_RECORD', 'ORIGINAL_FILE', 'SOURCE_PAGE', 'FORM', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportFormat" AS ENUM ('JSON', 'JSONL', 'JSON_GZIP', 'JSONL_GZIP');

-- CreateEnum
CREATE TYPE "ImportRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportMode" AS ENUM ('DRY_RUN', 'IMPORT');

-- CreateEnum
CREATE TYPE "ImportOutcome" AS ENUM ('INSERTED', 'UNCHANGED', 'NEW_VERSION', 'NEW_PARSE', 'REJECTED');

-- CreateEnum
CREATE TYPE "LegalReviewKind" AS ENUM ('LEGAL', 'OCR_TEXT', 'RELATIONSHIP');

-- CreateEnum
CREATE TYPE "LegalReviewVerdict" AS ENUM ('APPROVED', 'REJECTED', 'NEEDS_CHANGES');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SourceSite" ADD VALUE 'HUNG_YEN';
ALTER TYPE "SourceSite" ADD VALUE 'OTHER';

-- DropIndex
DROP INDEX "canonical_documents_normalizedNumber_documentType_issuingBo_key";

-- AlterTable
ALTER TABLE "canonical_documents" ADD COLUMN     "groupCode" TEXT,
ADD COLUMN     "qualityJson" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "reviewStatus" "LegalReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "scope" "LegalScope" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "selectedSnapshotId" UUID;

-- AlterTable
ALTER TABLE "document_sources" ADD COLUMN     "domain" TEXT,
ADD COLUMN     "normalizedUrl" TEXT,
ADD COLUMN     "sourceKind" "LegalSourceKind" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "sourceRecordId" TEXT;

-- AlterTable
ALTER TABLE "document_relations" ADD COLUMN     "origin" "LegalRelationOrigin" NOT NULL DEFAULT 'LEGACY',
ADD COLUMN     "provenanceJson" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "resolveStatus" "LegalResolveStatus" NOT NULL DEFAULT 'UNRESOLVED',
ADD COLUMN     "reviewStatus" "LegalReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "sourceSnapshotId" UUID,
ADD COLUMN     "targetSnapshotId" UUID;

-- CreateTable
CREATE TABLE "imported_document_identities" (
    "id" UUID NOT NULL,
    "datasetKey" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imported_document_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_snapshots" (
    "id" UUID NOT NULL,
    "documentId" TEXT NOT NULL,
    "contentHash" CHAR(64) NOT NULL,
    "metadataHash" CHAR(64) NOT NULL,
    "metadataJson" JSONB NOT NULL,
    "fullText" TEXT NOT NULL,
    "qualityJson" JSONB NOT NULL DEFAULT '{}',
    "correctionsJson" JSONB NOT NULL DEFAULT '{}',
    "parsedAt" TIMESTAMPTZ(6),
    "observedAt" TIMESTAMPTZ(6),
    "parserVersion" TEXT,
    "reason" "SnapshotReason" NOT NULL DEFAULT 'INITIAL_IMPORT',
    "rawRecordObjectKey" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_sources" (
    "id" UUID NOT NULL,
    "documentId" TEXT NOT NULL,
    "snapshotId" UUID NOT NULL,
    "sourceId" TEXT NOT NULL,
    "role" "SnapshotSourceRole" NOT NULL,
    "provenanceHash" CHAR(64) NOT NULL,
    "provenanceJson" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshot_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parse_runs" (
    "id" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,
    "parserVersion" TEXT NOT NULL,
    "structureHash" CHAR(64) NOT NULL,
    "structureJson" JSONB NOT NULL,
    "qualityJson" JSONB NOT NULL DEFAULT '{}',
    "offsetUnit" TEXT NOT NULL DEFAULT 'UNICODE_CODE_POINT',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sealedAt" TIMESTAMPTZ(6),

    CONSTRAINT "parse_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parsed_provisions" (
    "id" UUID NOT NULL,
    "parseRunId" UUID NOT NULL,
    "externalNodeId" TEXT NOT NULL,
    "nodeType" "ASTNodeType" NOT NULL,
    "ordinal" TEXT,
    "heading" TEXT,
    "spanStart" INTEGER NOT NULL,
    "spanEnd" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "depth" INTEGER NOT NULL,
    "contextJson" JSONB NOT NULL DEFAULT '[]',
    "quotedAmendmentCandidate" BOOLEAN NOT NULL DEFAULT false,
    "parentId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parsed_provisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_observations" (
    "id" UUID NOT NULL,
    "documentId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "snapshotId" UUID,
    "observedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "httpStatus" INTEGER,
    "rawHash" CHAR(64),
    "rawObjectKey" TEXT,
    "etag" TEXT,
    "lastModified" TEXT,
    "result" TEXT NOT NULL,
    "provenanceJson" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "source_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "object_assets" (
    "id" UUID NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "errorCode" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "object_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_assets" (
    "id" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "role" "SnapshotAssetRole" NOT NULL,
    "provenanceJson" JSONB NOT NULL DEFAULT '{}',
    "extractedText" TEXT,
    "extractedTextHash" CHAR(64),

    CONSTRAINT "snapshot_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_files" (
    "id" UUID NOT NULL,
    "datasetKey" TEXT NOT NULL,
    "fileHash" CHAR(64) NOT NULL,
    "format" "ImportFormat" NOT NULL,
    "originalName" TEXT NOT NULL,
    "schemaVersion" TEXT,
    "recordCount" INTEGER,
    "assetId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_runs" (
    "id" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "importerVersion" TEXT NOT NULL,
    "mode" "ImportMode" NOT NULL DEFAULT 'IMPORT',
    "status" "ImportRunStatus" NOT NULL DEFAULT 'QUEUED',
    "lastCommittedRecordIndex" INTEGER NOT NULL DEFAULT -1,
    "countersJson" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),
    "errorCode" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_record_results" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "recordIndex" INTEGER NOT NULL,
    "externalId" TEXT,
    "recordHash" CHAR(64),
    "outcome" "ImportOutcome" NOT NULL,
    "documentId" TEXT,
    "snapshotId" UUID,
    "errorCode" TEXT,
    "provenanceJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_record_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_review_decisions" (
    "id" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,
    "parseRunId" UUID,
    "kind" "LegalReviewKind" NOT NULL,
    "verdict" "LegalReviewVerdict" NOT NULL,
    "reviewerRef" TEXT NOT NULL,
    "asOfDate" DATE NOT NULL,
    "evidenceJson" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_review_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "imported_document_identities_documentId_idx" ON "imported_document_identities"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "imported_document_identities_datasetKey_externalId_key" ON "imported_document_identities"("datasetKey", "externalId");

-- CreateIndex
CREATE INDEX "document_snapshots_documentId_createdAt_idx" ON "document_snapshots"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "document_snapshots_documentId_contentHash_metadataHash_key" ON "document_snapshots"("documentId", "contentHash", "metadataHash");

-- CreateIndex
CREATE UNIQUE INDEX "document_snapshots_documentId_id_key" ON "document_snapshots"("documentId", "id");

-- CreateIndex
CREATE INDEX "snapshot_sources_sourceId_idx" ON "snapshot_sources"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "snapshot_sources_snapshotId_sourceId_role_provenanceHash_key" ON "snapshot_sources"("snapshotId", "sourceId", "role", "provenanceHash");

-- CreateIndex
CREATE UNIQUE INDEX "parse_runs_snapshotId_parserVersion_structureHash_key" ON "parse_runs"("snapshotId", "parserVersion", "structureHash");

-- CreateIndex
CREATE UNIQUE INDEX "parse_runs_snapshotId_id_key" ON "parse_runs"("snapshotId", "id");

-- CreateIndex
CREATE INDEX "parsed_provisions_parseRunId_orderIndex_idx" ON "parsed_provisions"("parseRunId", "orderIndex");

-- CreateIndex
CREATE INDEX "parsed_provisions_parentId_idx" ON "parsed_provisions"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "parsed_provisions_parseRunId_externalNodeId_key" ON "parsed_provisions"("parseRunId", "externalNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "parsed_provisions_parseRunId_id_key" ON "parsed_provisions"("parseRunId", "id");

-- CreateIndex
CREATE INDEX "source_observations_sourceId_observedAt_idx" ON "source_observations"("sourceId", "observedAt");

-- CreateIndex
CREATE INDEX "object_assets_checksum_idx" ON "object_assets"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "object_assets_bucket_objectKey_key" ON "object_assets"("bucket", "objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "snapshot_assets_snapshotId_assetId_role_key" ON "snapshot_assets"("snapshotId", "assetId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "import_files_datasetKey_fileHash_key" ON "import_files"("datasetKey", "fileHash");

-- CreateIndex
CREATE INDEX "import_runs_fileId_createdAt_idx" ON "import_runs"("fileId", "createdAt");

-- CreateIndex
CREATE INDEX "import_record_results_externalId_idx" ON "import_record_results"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "import_record_results_runId_recordIndex_key" ON "import_record_results"("runId", "recordIndex");

-- CreateIndex
CREATE INDEX "legal_review_decisions_snapshotId_kind_createdAt_idx" ON "legal_review_decisions"("snapshotId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "canonical_candidate_idx" ON "canonical_documents"("normalizedNumber", "documentType", "issuingBodyCode");

-- CreateIndex
CREATE UNIQUE INDEX "document_sources_documentId_id_key" ON "document_sources"("documentId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "document_sources_domain_normalizedUrl_key" ON "document_sources"("domain", "normalizedUrl");

-- CreateIndex
CREATE UNIQUE INDEX "document_sources_domain_sourceRecordId_key" ON "document_sources"("domain", "sourceRecordId");

-- AddForeignKey
ALTER TABLE "canonical_documents" ADD CONSTRAINT "canonical_documents_id_selectedSnapshotId_fkey" FOREIGN KEY ("id", "selectedSnapshotId") REFERENCES "document_snapshots"("documentId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_sourceDocId_sourceSnapshotId_fkey" FOREIGN KEY ("sourceDocId", "sourceSnapshotId") REFERENCES "document_snapshots"("documentId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_targetDocId_targetSnapshotId_fkey" FOREIGN KEY ("targetDocId", "targetSnapshotId") REFERENCES "document_snapshots"("documentId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "imported_document_identities" ADD CONSTRAINT "imported_document_identities_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_snapshots" ADD CONSTRAINT "document_snapshots_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_sources" ADD CONSTRAINT "snapshot_sources_documentId_snapshotId_fkey" FOREIGN KEY ("documentId", "snapshotId") REFERENCES "document_snapshots"("documentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_sources" ADD CONSTRAINT "snapshot_sources_documentId_sourceId_fkey" FOREIGN KEY ("documentId", "sourceId") REFERENCES "document_sources"("documentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parse_runs" ADD CONSTRAINT "parse_runs_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "document_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parsed_provisions" ADD CONSTRAINT "parsed_provisions_parseRunId_fkey" FOREIGN KEY ("parseRunId") REFERENCES "parse_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parsed_provisions" ADD CONSTRAINT "parsed_provisions_parseRunId_parentId_fkey" FOREIGN KEY ("parseRunId", "parentId") REFERENCES "parsed_provisions"("parseRunId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "source_observations" ADD CONSTRAINT "source_observations_documentId_sourceId_fkey" FOREIGN KEY ("documentId", "sourceId") REFERENCES "document_sources"("documentId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_observations" ADD CONSTRAINT "source_observations_documentId_snapshotId_fkey" FOREIGN KEY ("documentId", "snapshotId") REFERENCES "document_snapshots"("documentId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "snapshot_assets" ADD CONSTRAINT "snapshot_assets_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "document_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshot_assets" ADD CONSTRAINT "snapshot_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "object_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_files" ADD CONSTRAINT "import_files_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "object_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "import_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_record_results" ADD CONSTRAINT "import_record_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "import_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_record_results" ADD CONSTRAINT "import_record_results_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_record_results" ADD CONSTRAINT "import_record_results_documentId_snapshotId_fkey" FOREIGN KEY ("documentId", "snapshotId") REFERENCES "document_snapshots"("documentId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "legal_review_decisions" ADD CONSTRAINT "legal_review_decisions_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "document_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_review_decisions" ADD CONSTRAINT "legal_review_decisions_snapshotId_parseRunId_fkey" FOREIGN KEY ("snapshotId", "parseRunId") REFERENCES "parse_runs"("snapshotId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;
