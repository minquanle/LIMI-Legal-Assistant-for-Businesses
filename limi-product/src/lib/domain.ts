export type TaskStatus = "verify" | "todo" | "doing" | "review" | "done" | "not_applicable";
export type Organization = { id: string; legalName: string; taxId: string; createdAt: Date };
export type ComplianceTask = { id: string; organizationId: string; title: string; status: TaskStatus; ownerId: string | null; dueDate: Date | null; notApplicableReason: string | null; createdAt: Date; updatedAt: Date };
export type LegalAlert = { id: string; sourceUrl: string; sourceCode: string; title: string; effectiveDate: Date | null; publishedAt: Date };
