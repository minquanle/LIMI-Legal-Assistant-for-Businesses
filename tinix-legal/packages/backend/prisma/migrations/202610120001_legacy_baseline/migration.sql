-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LUAT', 'PHAP_LENH', 'NGHI_DINH', 'NGHI_QUYET', 'QUYET_DINH', 'THONG_TU', 'THONG_TU_LIEN_TICH', 'CHI_THI', 'CONG_VAN', 'THONG_BAO', 'LENH', 'KHAC');

-- CreateEnum
CREATE TYPE "ValidityStatus" AS ENUM ('CON_HIEU_LUC', 'HET_HIEU_LUC', 'HET_HIEU_LUC_MOT_PHAN', 'CHUA_CO_HIEU_LUC', 'NGUNG_HIEU_LUC', 'KHONG_XAC_DINH');

-- CreateEnum
CREATE TYPE "SourceSite" AS ENUM ('VBPL', 'THUVIENPHAPLUAT', 'LUATVIETNAM', 'PHAPDIEN', 'CHINHPHU', 'VANBANPHAPLUAT', 'DULIEUPHAPLUAT');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('CAN_CU', 'HUONG_DAN', 'SUA_DOI', 'THAY_THE', 'BAI_BO', 'LIEN_QUAN', 'HOP_NHAT', 'DINH_CHINH', 'GIA_HAN', 'NGUNG_HIEU_LUC', 'KHOI_PHUC_HIEU_LUC');

-- CreateEnum
CREATE TYPE "ASTNodeType" AS ENUM ('PHAN', 'CHUONG', 'MUC', 'DIEU', 'KHOAN', 'DIEM', 'PHU_LUC', 'TEXT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'LEGAL_CHECK', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED', 'DRAFT');

-- CreateTable
CREATE TABLE "canonical_documents" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "normalizedNumber" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "issuingBody" TEXT NOT NULL,
    "issuingBodyCode" TEXT NOT NULL DEFAULT '',
    "signer" TEXT NOT NULL DEFAULT '',
    "promulgationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "validityStatus" "ValidityStatus" NOT NULL DEFAULT 'KHONG_XAC_DINH',
    "preciseValidityStatus" TEXT NOT NULL DEFAULT '',
    "field" TEXT NOT NULL DEFAULT '',
    "gazetteNumber" TEXT NOT NULL DEFAULT '',
    "gazetteDate" TIMESTAMP(3),
    "isConsolidated" BOOLEAN NOT NULL DEFAULT false,
    "isTranslation" BOOLEAN NOT NULL DEFAULT false,
    "trichYeu" TEXT NOT NULL DEFAULT '',
    "expiryDate" TIMESTAMP(3),
    "author" TEXT NOT NULL DEFAULT '',
    "lastUpdatedAt" TIMESTAMP(3),
    "fullText" TEXT NOT NULL DEFAULT '',
    "ast" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parseConfidence" DOUBLE PRECISION,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "parseQualityFlags" JSONB NOT NULL DEFAULT '[]',
    "metadataSource" JSONB NOT NULL DEFAULT '{}',
    "suggestedRelations" JSONB NOT NULL DEFAULT '[]',
    "fieldCode" TEXT,
    "lastParserAssistAt" TIMESTAMP(3),

    CONSTRAINT "canonical_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sources" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "site" "SourceSite" NOT NULL,
    "url" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL DEFAULT '',
    "lastCrawledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawHtml" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_ast_nodes" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "nodeType" "ASTNodeType" NOT NULL,
    "ordinal" TEXT NOT NULL,
    "heading" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "path" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_ast_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_relations" (
    "id" TEXT NOT NULL,
    "sourceDocId" TEXT NOT NULL,
    "targetDocId" TEXT,
    "targetDocNumber" TEXT NOT NULL,
    "relationType" "RelationshipType" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sourceNodeRef" TEXT,
    "targetNodeRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_logs" (
    "id" TEXT NOT NULL,
    "site" "SourceSite" NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "documentsFound" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_embeddings" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "embedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "templateBody" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "templateId" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draft_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_citations" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "canonicalDocId" TEXT,
    "citationText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_configs" (
    "id" TEXT NOT NULL,
    "orgName" TEXT NOT NULL DEFAULT 'Doanh nghiệp mặc định',
    "workflowSteps" JSONB NOT NULL DEFAULT '[]',
    "alertThresholds" JSONB NOT NULL DEFAULT '[30, 15, 7]',
    "riskRules" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_histories" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "stepName" TEXT NOT NULL DEFAULT '',
    "actorName" TEXT NOT NULL DEFAULT '',
    "actorRole" TEXT NOT NULL DEFAULT '',
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "orgCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT NOT NULL DEFAULT '',
    "industry" TEXT NOT NULL DEFAULT 'CONG_NGHE',
    "domain" TEXT NOT NULL DEFAULT '',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'ENTERPRISE',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_units" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitType" TEXT NOT NULL DEFAULT 'DEPARTMENT',
    "description" TEXT NOT NULL DEFAULT '',
    "managerName" TEXT NOT NULL DEFAULT '',
    "managerEmail" TEXT NOT NULL DEFAULT '',
    "approvalLimitVND" DOUBLE PRECISION,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'NOI_QUY_LAO_DONG',
    "description" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT NOT NULL DEFAULT '',
    "fileType" TEXT NOT NULL DEFAULT 'PDF',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "uploadedBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "sectionTitle" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_masters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "contractNumber" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL DEFAULT '',
    "contractValue" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentMilestones" JSONB NOT NULL DEFAULT '[]',
    "attachmentUrl" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "draftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_workflow_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "isGlobalTemplate" BOOLEAN NOT NULL DEFAULT true,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "boundLegalFields" JSONB NOT NULL DEFAULT '[]',
    "systemPrompt" TEXT NOT NULL DEFAULT '',
    "complianceChecklist" JSONB NOT NULL DEFAULT '[]',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_workflow_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL,
    "workflowConfigId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "checklistResults" JSONB NOT NULL DEFAULT '{}',
    "aiAuditNotes" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_provider_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL DEFAULT '',
    "baseUrl" TEXT NOT NULL DEFAULT '',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "taskAssignments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "unitId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT 'Ban Pháp chế',
    "jobTitle" TEXT NOT NULL DEFAULT 'Chuyên viên Pháp lý',
    "roleCode" TEXT NOT NULL DEFAULT 'LEGAL_SPECIALIST',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT NOT NULL DEFAULT '',
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "userName" TEXT NOT NULL DEFAULT 'System',
    "userRole" TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT DEFAULT '',
    "details" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_addendums" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "addendumNumber" TEXT NOT NULL,
    "valueAdjustment" DOUBLE PRECISION,
    "dateAdjustment" TIMESTAMP(3),
    "contentDiff" JSONB,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_addendums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_token_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "costUSD" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "userRole" TEXT NOT NULL DEFAULT 'BUSINESS_USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_token_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_risk_audits" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "draftId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "auditReport" JSONB NOT NULL DEFAULT '[]',
    "playbookData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_risk_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_risk_rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "penaltyScore" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "llmPrompt" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_risk_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'system',
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_watchlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "documentId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_qa_topics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT 'file-text',
    "qaCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_qa_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_qa_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "documentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "situation" TEXT,
    "tldrSummary" TEXT,
    "persona" TEXT NOT NULL DEFAULT 'Chung',
    "practicalTip" TEXT,
    "legalBasis" TEXT NOT NULL DEFAULT '',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "unhelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_qa_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_milestones" (
    "id" TEXT NOT NULL,
    "contractTitle" TEXT NOT NULL,
    "milestoneTitle" TEXT NOT NULL,
    "milestoneType" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "relativeOffset" TEXT,
    "amount" TEXT,
    "obligatedParty" TEXT,
    "actionRequired" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "reminderDays" INTEGER NOT NULL DEFAULT 7,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_radar_alerts" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "industryName" TEXT NOT NULL,
    "documentId" TEXT,
    "documentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "promulgationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "summary" TEXT NOT NULL,
    "financialImpact" TEXT,
    "operationalImpact" TEXT,
    "hrImpact" TEXT,
    "penaltyReference" TEXT,
    "maxPenaltyAmount" TEXT,
    "gapQuestions" JSONB NOT NULL DEFAULT '[]',
    "affectedAreas" JSONB NOT NULL DEFAULT '[]',
    "actionChecklist" JSONB NOT NULL DEFAULT '[]',
    "deadlineDate" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "applicableSubjects" JSONB NOT NULL DEFAULT '[]',
    "complianceChecklist" JSONB NOT NULL DEFAULT '[]',
    "relatedDocumentRefs" JSONB NOT NULL DEFAULT '[]',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "aiGeneratedAt" TIMESTAMP(3),
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_radar_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_analysis_runs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "rawResponse" TEXT,
    "parsedOutput" JSONB,
    "errorMessage" TEXT,
    "alertsCreated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_analysis_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parser_assist_runs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "triggeredFlags" JSONB NOT NULL DEFAULT '[]',
    "provider" TEXT,
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "rawResponse" TEXT,
    "parsedOutput" JSONB,
    "fieldsCorrected" JSONB NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parser_assist_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_audit_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "score" INTEGER,
    "tier" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "compliantCount" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_audit_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checklist_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "actionIndex" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_checklist_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_industry_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_industry_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_law_precedents" (
    "id" TEXT NOT NULL,
    "precedentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "issuingDecision" TEXT NOT NULL,
    "approvalDate" TIMESTAMP(3),
    "legalRule" TEXT NOT NULL,
    "factualSummary" TEXT NOT NULL,
    "applicableArticles" TEXT,
    "fullText" TEXT NOT NULL,
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_law_precedents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_procedure_guides" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "processingDays" INTEGER NOT NULL DEFAULT 3,
    "fee" TEXT NOT NULL DEFAULT 'Miễn phí',
    "targetSubject" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "dossierList" JSONB NOT NULL DEFAULT '[]',
    "stepTimeline" JSONB NOT NULL DEFAULT '[]',
    "templates" JSONB NOT NULL DEFAULT '[]',
    "onlinePortalUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_procedure_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_violations" (
    "id" TEXT NOT NULL,
    "sourceDocId" TEXT NOT NULL,
    "sourceDocNumber" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "behavior" TEXT NOT NULL,
    "fineIndividualMin" DECIMAL(14,0),
    "fineIndividualMax" DECIMAL(14,0),
    "fineOrgMin" DECIMAL(14,0),
    "fineOrgMax" DECIMAL(14,0),
    "pointsDeducted" INTEGER,
    "dieuOrdinal" TEXT NOT NULL,
    "khoanOrdinal" TEXT NOT NULL,
    "diemOrdinal" TEXT,
    "citation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_lookups" (
    "id" TEXT NOT NULL,
    "datasetKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "searchText" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "externalKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reference_lookups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_jobs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "groupName" TEXT NOT NULL DEFAULT '',
    "importTarget" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "schedule" TEXT NOT NULL,
    "maxNewUrls" INTEGER NOT NULL DEFAULT 5000,
    "lastRunAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "lastDurationMs" INTEGER,
    "lastNewRecords" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_job_runs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "newUrls" INTEGER NOT NULL DEFAULT 0,
    "newRecords" INTEGER NOT NULL DEFAULT 0,
    "failedUrls" INTEGER NOT NULL DEFAULT 0,
    "imported" INTEGER NOT NULL DEFAULT 0,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "logTail" TEXT,

    CONSTRAINT "crawl_job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "canonical_documents_documentType_idx" ON "canonical_documents"("documentType");

-- CreateIndex
CREATE INDEX "canonical_documents_validityStatus_idx" ON "canonical_documents"("validityStatus");

-- CreateIndex
CREATE INDEX "canonical_documents_issuingBody_idx" ON "canonical_documents"("issuingBody");

-- CreateIndex
CREATE INDEX "canonical_documents_promulgationDate_idx" ON "canonical_documents"("promulgationDate");

-- CreateIndex
CREATE INDEX "canonical_documents_effectiveDate_idx" ON "canonical_documents"("effectiveDate");

-- CreateIndex
CREATE INDEX "canonical_documents_isConsolidated_idx" ON "canonical_documents"("isConsolidated");

-- CreateIndex
CREATE INDEX "canonical_documents_isTranslation_idx" ON "canonical_documents"("isTranslation");

-- CreateIndex
CREATE INDEX "canonical_documents_promulgationDate_documentType_idx" ON "canonical_documents"("promulgationDate", "documentType");

-- CreateIndex
CREATE INDEX "canonical_documents_needsReview_idx" ON "canonical_documents"("needsReview");

-- CreateIndex
CREATE UNIQUE INDEX "canonical_documents_normalizedNumber_documentType_issuingBo_key" ON "canonical_documents"("normalizedNumber", "documentType", "issuingBodyCode");

-- CreateIndex
CREATE INDEX "document_sources_documentId_idx" ON "document_sources"("documentId");

-- CreateIndex
CREATE INDEX "document_sources_site_idx" ON "document_sources"("site");

-- CreateIndex
CREATE UNIQUE INDEX "document_sources_site_url_key" ON "document_sources"("site", "url");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_hash_key" ON "attachments"("hash");

-- CreateIndex
CREATE INDEX "attachments_documentId_idx" ON "attachments"("documentId");

-- CreateIndex
CREATE INDEX "legal_ast_nodes_documentId_idx" ON "legal_ast_nodes"("documentId");

-- CreateIndex
CREATE INDEX "legal_ast_nodes_nodeType_idx" ON "legal_ast_nodes"("nodeType");

-- CreateIndex
CREATE INDEX "legal_ast_nodes_path_idx" ON "legal_ast_nodes"("path");

-- CreateIndex
CREATE INDEX "legal_ast_nodes_parentId_idx" ON "legal_ast_nodes"("parentId");

-- CreateIndex
CREATE INDEX "document_relations_sourceDocId_idx" ON "document_relations"("sourceDocId");

-- CreateIndex
CREATE INDEX "document_relations_targetDocId_idx" ON "document_relations"("targetDocId");

-- CreateIndex
CREATE INDEX "document_relations_targetDocNumber_idx" ON "document_relations"("targetDocNumber");

-- CreateIndex
CREATE INDEX "document_relations_relationType_idx" ON "document_relations"("relationType");

-- CreateIndex
CREATE INDEX "crawl_logs_site_idx" ON "crawl_logs"("site");

-- CreateIndex
CREATE INDEX "crawl_logs_createdAt_idx" ON "crawl_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "document_embeddings_documentId_key" ON "document_embeddings"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_templates_code_key" ON "document_templates"("code");

-- CreateIndex
CREATE INDEX "draft_citations_draftId_idx" ON "draft_citations"("draftId");

-- CreateIndex
CREATE INDEX "approval_histories_draftId_idx" ON "approval_histories"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_orgCode_key" ON "organizations"("orgCode");

-- CreateIndex
CREATE INDEX "organizations_orgCode_idx" ON "organizations"("orgCode");

-- CreateIndex
CREATE INDEX "organizations_isActive_idx" ON "organizations"("isActive");

-- CreateIndex
CREATE INDEX "organization_units_organizationId_idx" ON "organization_units"("organizationId");

-- CreateIndex
CREATE INDEX "organization_units_parentId_idx" ON "organization_units"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_units_organizationId_code_key" ON "organization_units"("organizationId", "code");

-- CreateIndex
CREATE INDEX "enterprise_documents_organizationId_idx" ON "enterprise_documents"("organizationId");

-- CreateIndex
CREATE INDEX "enterprise_documents_category_idx" ON "enterprise_documents"("category");

-- CreateIndex
CREATE INDEX "enterprise_documents_status_idx" ON "enterprise_documents"("status");

-- CreateIndex
CREATE INDEX "enterprise_document_chunks_documentId_idx" ON "enterprise_document_chunks"("documentId");

-- CreateIndex
CREATE INDEX "enterprise_document_chunks_chunkIndex_idx" ON "enterprise_document_chunks"("chunkIndex");

-- CreateIndex
CREATE INDEX "contract_masters_organizationId_idx" ON "contract_masters"("organizationId");

-- CreateIndex
CREATE INDEX "contract_masters_status_idx" ON "contract_masters"("status");

-- CreateIndex
CREATE INDEX "contract_masters_endDate_idx" ON "contract_masters"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "business_workflow_configs_code_key" ON "business_workflow_configs"("code");

-- CreateIndex
CREATE INDEX "business_workflow_configs_organizationId_idx" ON "business_workflow_configs"("organizationId");

-- CreateIndex
CREATE INDEX "workflow_executions_workflowConfigId_idx" ON "workflow_executions"("workflowConfigId");

-- CreateIndex
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions"("status");

-- CreateIndex
CREATE INDEX "ai_provider_configs_organizationId_idx" ON "ai_provider_configs"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_key" ON "role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_organizationId_idx" ON "admin_users"("organizationId");

-- CreateIndex
CREATE INDEX "admin_users_unitId_idx" ON "admin_users"("unitId");

-- CreateIndex
CREATE INDEX "admin_users_roleCode_idx" ON "admin_users"("roleCode");

-- CreateIndex
CREATE INDEX "admin_users_status_idx" ON "admin_users"("status");

-- CreateIndex
CREATE INDEX "admin_users_department_idx" ON "admin_users"("department");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_tokenHash_key" ON "admin_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "admin_sessions_userId_idx" ON "admin_sessions"("userId");

-- CreateIndex
CREATE INDEX "admin_sessions_expiresAt_idx" ON "admin_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_organizationId_idx" ON "admin_audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_userId_idx" ON "admin_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_audit_logs_resource_idx" ON "admin_audit_logs"("resource");

-- CreateIndex
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "contract_addendums_contractId_idx" ON "contract_addendums"("contractId");

-- CreateIndex
CREATE INDEX "contract_addendums_parentId_idx" ON "contract_addendums"("parentId");

-- CreateIndex
CREATE INDEX "ai_token_logs_organizationId_idx" ON "ai_token_logs"("organizationId");

-- CreateIndex
CREATE INDEX "ai_token_logs_provider_idx" ON "ai_token_logs"("provider");

-- CreateIndex
CREATE INDEX "ai_token_logs_task_idx" ON "ai_token_logs"("task");

-- CreateIndex
CREATE INDEX "ai_token_logs_createdAt_idx" ON "ai_token_logs"("createdAt");

-- CreateIndex
CREATE INDEX "contract_risk_audits_contractId_idx" ON "contract_risk_audits"("contractId");

-- CreateIndex
CREATE INDEX "contract_risk_audits_draftId_idx" ON "contract_risk_audits"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_risk_rules_code_key" ON "contract_risk_rules"("code");

-- CreateIndex
CREATE INDEX "conversation_messages_sessionId_idx" ON "conversation_messages"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_watchlists_userId_documentId_key" ON "user_watchlists"("userId", "documentId");

-- CreateIndex
CREATE INDEX "user_notifications_userId_idx" ON "user_notifications"("userId");

-- CreateIndex
CREATE INDEX "user_notifications_read_idx" ON "user_notifications"("read");

-- CreateIndex
CREATE UNIQUE INDEX "legal_qa_topics_name_key" ON "legal_qa_topics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "legal_qa_topics_slug_key" ON "legal_qa_topics"("slug");

-- CreateIndex
CREATE INDEX "legal_qa_items_documentId_idx" ON "legal_qa_items"("documentId");

-- CreateIndex
CREATE INDEX "legal_qa_items_topicId_idx" ON "legal_qa_items"("topicId");

-- CreateIndex
CREATE INDEX "legal_qa_items_persona_idx" ON "legal_qa_items"("persona");

-- CreateIndex
CREATE INDEX "legal_qa_items_slug_idx" ON "legal_qa_items"("slug");

-- CreateIndex
CREATE INDEX "legal_qa_items_status_idx" ON "legal_qa_items"("status");

-- CreateIndex
CREATE INDEX "contract_milestones_milestoneType_idx" ON "contract_milestones"("milestoneType");

-- CreateIndex
CREATE INDEX "contract_milestones_dueDate_idx" ON "contract_milestones"("dueDate");

-- CreateIndex
CREATE INDEX "contract_milestones_isCompleted_idx" ON "contract_milestones"("isCompleted");

-- CreateIndex
CREATE INDEX "compliance_radar_alerts_industry_idx" ON "compliance_radar_alerts"("industry");

-- CreateIndex
CREATE INDEX "compliance_radar_alerts_severity_idx" ON "compliance_radar_alerts"("severity");

-- CreateIndex
CREATE INDEX "compliance_radar_alerts_effectiveDate_idx" ON "compliance_radar_alerts"("effectiveDate");

-- CreateIndex
CREATE INDEX "compliance_radar_alerts_needsReview_idx" ON "compliance_radar_alerts"("needsReview");

-- CreateIndex
CREATE INDEX "compliance_radar_alerts_isAiGenerated_idx" ON "compliance_radar_alerts"("isAiGenerated");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_radar_alerts_industry_documentNumber_key" ON "compliance_radar_alerts"("industry", "documentNumber");

-- CreateIndex
CREATE INDEX "compliance_analysis_runs_documentId_idx" ON "compliance_analysis_runs"("documentId");

-- CreateIndex
CREATE INDEX "compliance_analysis_runs_status_idx" ON "compliance_analysis_runs"("status");

-- CreateIndex
CREATE INDEX "compliance_analysis_runs_createdAt_idx" ON "compliance_analysis_runs"("createdAt");

-- CreateIndex
CREATE INDEX "parser_assist_runs_documentId_idx" ON "parser_assist_runs"("documentId");

-- CreateIndex
CREATE INDEX "parser_assist_runs_status_idx" ON "parser_assist_runs"("status");

-- CreateIndex
CREATE INDEX "compliance_audit_results_userId_alertId_idx" ON "compliance_audit_results"("userId", "alertId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_checklist_progress_userId_alertId_actionIndex_key" ON "compliance_checklist_progress"("userId", "alertId", "actionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "radar_industry_subscriptions_userId_industry_key" ON "radar_industry_subscriptions"("userId", "industry");

-- CreateIndex
CREATE UNIQUE INDEX "case_law_precedents_precedentNumber_key" ON "case_law_precedents"("precedentNumber");

-- CreateIndex
CREATE INDEX "case_law_precedents_topic_idx" ON "case_law_precedents"("topic");

-- CreateIndex
CREATE INDEX "case_law_precedents_precedentNumber_idx" ON "case_law_precedents"("precedentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "admin_procedure_guides_code_key" ON "admin_procedure_guides"("code");

-- CreateIndex
CREATE INDEX "admin_procedure_guides_category_idx" ON "admin_procedure_guides"("category");

-- CreateIndex
CREATE INDEX "admin_violations_sourceDocId_idx" ON "admin_violations"("sourceDocId");

-- CreateIndex
CREATE INDEX "admin_violations_field_idx" ON "admin_violations"("field");

-- CreateIndex
CREATE INDEX "admin_violations_vehicleType_idx" ON "admin_violations"("vehicleType");

-- CreateIndex
CREATE INDEX "reference_lookups_datasetKey_idx" ON "reference_lookups"("datasetKey");

-- CreateIndex
CREATE UNIQUE INDEX "reference_lookups_datasetKey_externalKey_key" ON "reference_lookups"("datasetKey", "externalKey");

-- CreateIndex
CREATE UNIQUE INDEX "crawl_jobs_key_key" ON "crawl_jobs"("key");

-- CreateIndex
CREATE INDEX "crawl_job_runs_jobId_startedAt_idx" ON "crawl_job_runs"("jobId", "startedAt");

-- AddForeignKey
ALTER TABLE "document_sources" ADD CONSTRAINT "document_sources_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_ast_nodes" ADD CONSTRAINT "legal_ast_nodes_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_ast_nodes" ADD CONSTRAINT "legal_ast_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "legal_ast_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_sourceDocId_fkey" FOREIGN KEY ("sourceDocId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_targetDocId_fkey" FOREIGN KEY ("targetDocId") REFERENCES "canonical_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_documents" ADD CONSTRAINT "draft_documents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_citations" ADD CONSTRAINT "draft_citations_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "draft_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_histories" ADD CONSTRAINT "approval_histories_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "draft_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organization_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_documents" ADD CONSTRAINT "enterprise_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_document_chunks" ADD CONSTRAINT "enterprise_document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "enterprise_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_masters" ADD CONSTRAINT "contract_masters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_masters" ADD CONSTRAINT "contract_masters_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "draft_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_workflow_configs" ADD CONSTRAINT "business_workflow_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflowConfigId_fkey" FOREIGN KEY ("workflowConfigId") REFERENCES "business_workflow_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "ai_provider_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_roleCode_fkey" FOREIGN KEY ("roleCode") REFERENCES "role_permissions"("role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_addendums" ADD CONSTRAINT "contract_addendums_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "contract_addendums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_token_logs" ADD CONSTRAINT "ai_token_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_risk_audits" ADD CONSTRAINT "contract_risk_audits_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_risk_audits" ADD CONSTRAINT "contract_risk_audits_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "draft_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "conversation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_watchlists" ADD CONSTRAINT "user_watchlists_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_qa_items" ADD CONSTRAINT "legal_qa_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_qa_items" ADD CONSTRAINT "legal_qa_items_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "legal_qa_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_analysis_runs" ADD CONSTRAINT "compliance_analysis_runs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parser_assist_runs" ADD CONSTRAINT "parser_assist_runs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_audit_results" ADD CONSTRAINT "compliance_audit_results_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "compliance_radar_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checklist_progress" ADD CONSTRAINT "compliance_checklist_progress_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "compliance_radar_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_violations" ADD CONSTRAINT "admin_violations_sourceDocId_fkey" FOREIGN KEY ("sourceDocId") REFERENCES "canonical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_job_runs" ADD CONSTRAINT "crawl_job_runs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "crawl_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
