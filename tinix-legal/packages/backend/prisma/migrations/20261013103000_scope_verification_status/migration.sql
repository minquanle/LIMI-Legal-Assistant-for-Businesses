ALTER TABLE "ComplianceTask" DROP CONSTRAINT task_status_check;
ALTER TABLE "ComplianceTask" ADD CONSTRAINT task_status_check
 CHECK (status IN ('TODO','DOING','DONE','NOT_APPLICABLE'));
