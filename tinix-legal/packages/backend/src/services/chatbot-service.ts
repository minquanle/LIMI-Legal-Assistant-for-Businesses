import { prisma } from '../infrastructure/db.js';
import { CopilotLLMService } from './copilot-llm-service.js';
import { CopilotRAGService } from './copilot-rag-service.js';

export class ChatbotService {
  static async chat(sessionId: string, userMessage: string, userId: string = 'system') {
    // 1. Get or create session. upsert is atomic — a separate findUnique+create
    // pair could have two concurrent first-messages for the same new session
    // both pass the null check and both attempt create, throwing a
    // unique-constraint error on the loser instead of just proceeding.
    await prisma.conversationSession.upsert({
      where: { id: sessionId },
      update: { updatedAt: new Date() },
      create: { id: sessionId, title: userMessage.substring(0, 50), userId },
    });

    // 2. Save user message
    await prisma.conversationMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: userMessage
      }
    });

    // 3. Load last 10 messages for context
    const history = await prisma.conversationMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    history.reverse(); // chronological order

    const conversationContext = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    // 4. Run RAG search for the current message
    const searchContext = await CopilotRAGService.getContext(userMessage, 5);
    const ragMarkdown = CopilotRAGService.formatRAGPrompt(searchContext);

    // 5. Build prompt with history
    const prompt = `Ngữ cảnh hội thoại trước đó:\n${conversationContext}\n\nCăn cứ pháp lý mới nhất:\n${ragMarkdown}\n\nCâu hỏi mới nhất: ${userMessage}`;

    // 6. Call LLM
    const response = await CopilotLLMService.complete({
      prompt,
      mode: 'suggest_citations'
    });

    const citationsJson = searchContext.map(c => ({
      documentId: c.id,
      documentNumber: c.documentNumber,
      title: c.title
    }));


    // 7. Save assistant message
    const assistantMessage = await prisma.conversationMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: response.completion,
        citations: citationsJson as any
      }
    });

    return assistantMessage;
  }
}
