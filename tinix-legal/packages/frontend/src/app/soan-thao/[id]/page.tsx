import { apiClient } from '@/lib/api-client';
import { DraftingWorkspace } from '@/components/copilot/DraftingWorkspace';
import { convertMarkdownToLegalHtml } from '@/lib/legal-markdown-parser';

export default async function SoanThaoEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ templateId?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  if (id === 'moi') {
    let initialTitle = 'Dự thảo mới';
    let initialContent = '';

    if (sp.templateId) {
      try {
        const templates = await apiClient.getCopilotTemplates();
        const found = templates.find((t: any) => t.id === sp.templateId);
        if (found) {
          initialTitle = `Dự thảo - ${found.title}`;
          initialContent = convertMarkdownToLegalHtml(found.templateBody || '');
        }
      } catch {
        // Fallback default
      }
    }

    return <DraftingWorkspace initialDraft={{ title: initialTitle, content: initialContent }} />;
  }

  // Load existing draft
  const draft = await apiClient.getDraftById(id).catch(() => null);

  if (!draft) {
    return <DraftingWorkspace initialDraft={{ title: 'Dự thảo mới' }} />;
  }

  // Saved drafts are stored as HTML (WordOnlineEditor emits editor.getHTML() on
  // save). DraftingWorkspace already does its own robust already-HTML detection
  // before deciding whether to run convertMarkdownToLegalHtml — converting here
  // too, unconditionally, risked re-parsing real HTML as markdown on every
  // reload and corrupting formatting over successive edit/save cycles.
  return <DraftingWorkspace initialDraft={draft} />;
}

