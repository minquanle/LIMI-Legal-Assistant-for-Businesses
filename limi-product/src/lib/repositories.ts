import type { ComplianceTask, Organization, TaskStatus } from "./domain";

/** Database providers implement these contracts; UI does not depend on a provider. */
export interface OrganizationRepository { findById(id: string): Promise<Organization | null>; create(input: Pick<Organization, "legalName" | "taxId">): Promise<Organization>; }
export interface TaskRepository { listForOrganization(organizationId: string): Promise<ComplianceTask[]>; updateStatus(input: { taskId: string; status: TaskStatus; notApplicableReason?: string | null }): Promise<ComplianceTask>; setDueDate(taskId: string, dueDate: Date | null): Promise<ComplianceTask>; }
