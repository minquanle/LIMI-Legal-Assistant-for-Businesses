export class DocxExportService {
  /**
   * Formats draft markdown content into an administrative document layout.
   */
  static formatAdministrativeDocument(title: string, content: string): string {
    const lines = (content || '').split('\n');
    let formatted = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n-------------------\n\n`;
    formatted += `${title.toUpperCase()}\n\n`;
    formatted += lines.join('\n');
    return formatted;
  }
}
