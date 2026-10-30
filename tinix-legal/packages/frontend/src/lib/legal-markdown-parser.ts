/**
 * Parser & Formatter for Vietnamese Administrative Legal Documents (Nghị định 30/2020/NĐ-CP)
 * Converts raw Markdown or template body into standard, styled HTML ready for TipTap WYSIWYG Editor.
 */

function sanitizeInput(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*(["'])[\s\S]*?\1/gi, '')
    .replace(/javascript:/gi, 'blocked:');
}

export function convertMarkdownToLegalHtml(markdown: string): string {
  if (!markdown || markdown.trim() === '') {
    return '<p>Nhập nội dung văn bản...</p>';
  }

  const cleanMarkdown = sanitizeInput(markdown);

  // If already full HTML with tables and styled headings, return as is
  if (
    cleanMarkdown.trim().startsWith('<table') ||
    (cleanMarkdown.includes('<h2>') && cleanMarkdown.includes('<p>') && !cleanMarkdown.includes('| :--- |'))
  ) {
    return cleanMarkdown;
  }

  const lines = cleanMarkdown.split('\n');

  const htmlParts: string[] = [];

  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;

    // Check if this is a 2-column signature table (Nơi nhận, Bên A / Bên B, Người ký, Người trình, Ban Giám đốc)
    const isSignatureTable = tableRows.some((row) =>
      row.some((cell) =>
        cell.includes('Nơi nhận') ||
        cell.includes('Ký') ||
        cell.includes('GIÁM ĐỐC') ||
        cell.includes('CHỦ TỊCH') ||
        cell.includes('BÊN A') ||
        cell.includes('BÊN B') ||
        cell.includes('TRƯỞNG PHÒNG') ||
        cell.includes('THỦ TRƯỞNG') ||
        cell.includes('NGƯỜI LAO ĐỘNG') ||
        cell.includes('NHÂN VIÊN') ||
        cell.includes('BÊN MUA') ||
        cell.includes('BÊN BÁN')
      )
    );

    if (isSignatureTable) {
      const leftCells = tableRows.map((r) => r[0] || '').filter(Boolean);
      const rightCells = tableRows.map((r) => r[1] || '').filter(Boolean);

      const hasNoiNhan = leftCells.some((c) => c.includes('Nơi nhận'));

      const leftHtml = leftCells
        .map((text) => {
          if (text.includes('Nơi nhận:')) {
            return `<p style="font-weight: bold; font-style: italic; font-size: 12pt; margin: 0 0 4px 0;">Nơi nhận:</p>`;
          }
          if (text.startsWith('- ') || text.startsWith('* ')) {
            return `<p style="font-size: 11pt; margin: 2px 0; line-height: 1.3;">${formatInlineText(text)}</p>`;
          }
          return `<p style="text-align: center; font-size: 13pt; margin: 2px 0;">${formatInlineText(text)}</p>`;
        })
        .join('');

      const rightHtml = rightCells
        .map((text) => {
          if (text.includes('(Ký') || text.includes('(ký')) {
            return `<p style="text-align: center; font-style: italic; font-size: 11pt; margin: 2px 0 24px 0; color: #475569;">${formatInlineText(text)}</p>`;
          }
          return `<p style="text-align: center; font-size: 13pt; margin: 2px 0; font-weight: bold;">${formatInlineText(text)}</p>`;
        })
        .join('');

      htmlParts.push(`
        <table style="width: 100%; border: none; border-collapse: collapse; margin-top: 32px; margin-bottom: 24px;">
          <tbody>
            <tr style="border: none;">
              <td style="width: 50%; vertical-align: top; border: none; padding: 4px 8px; ${hasNoiNhan ? 'font-size: 11pt;' : 'text-align: center; font-size: 13pt;'} line-height: 1.4;">
                ${leftHtml}
              </td>
              <td style="width: 50%; vertical-align: top; text-align: center; border: none; padding: 4px 8px; font-size: 13pt; line-height: 1.4;">
                ${rightHtml}
              </td>
            </tr>
          </tbody>
        </table>
      `);
    } else {
      // Standard data table
      let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #cbd5e1;"><tbody>';
      for (const row of tableRows) {
        tableHtml += '<tr>';
        for (const cell of row) {
          tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13pt;">${formatInlineText(cell)}</td>`;
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table>';
      htmlParts.push(tableHtml);
    }

    tableRows = [];
    inTable = false;
  };

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Table line: | col1 | col2 |
    if (line.startsWith('|') && line.endsWith('|')) {
      // Skip markdown separator row | :--- | :--- |
      if (/^\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|/.test(line)) {
        i++;
        continue;
      }
      inTable = true;
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Explicit page break tokens: <!-- pagebreak -->, [ngat-trang], [pagebreak], or <hr ... page-break ...>
    if (
      line === '<!-- pagebreak -->' ||
      line === '[ngat-trang]' ||
      line === '[pagebreak]' ||
      line.includes('data-type="page-break"') ||
      line.includes('class="page-break"')
    ) {
      htmlParts.push('<hr data-type="page-break" class="page-break" />');
      i++;
      continue;
    }

    if (!line || line === '---') {
      i++;
      continue;
    }


    // Top Header: National Motto or Organization Name
    if (line.startsWith('# CỘNG HÒA') || line.includes('Độc lập - Tự do - Hạnh phúc')) {
      let dateLine = '';
      if (lines[i + 1]?.trim().startsWith('**Độc lập')) i++;
      if (lines[i + 1]?.trim().startsWith('---')) i++;

      htmlParts.push(`
        <div style="text-align: center; margin-bottom: 24px;">
          <p style="text-align: center; margin: 0; font-weight: bold; font-size: 13pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p style="text-align: center; margin: 2px 0; font-size: 14pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</p>
          <hr style="width: 35%; margin: 6px auto; border-top: 1px solid #475569;"/>
        </div>
      `);
      i++;
      continue;
    }

    // Top Header: Company / Organization Name (Left Column) + National Motto (Right Column)
    if (
      line.startsWith('# ') &&
      (line.includes('CÔNG TY') ||
        line.includes('TẬP ĐOÀN') ||
        line.includes('BỘ') ||
        line.includes('UBND') ||
        line.includes('HỘI ĐỒNG') ||
        line.includes('PHÒNG') ||
        line.includes('CƠ QUAN'))
    ) {
      const companyName = line.replace(/^#\s*/, '').trim();
      let nextLine = lines[i + 1]?.trim() || '';
      let dateLine = lines[i + 2]?.trim() || '';

      let docNumber = '';
      let dateStr = '';

      if (nextLine.startsWith('**Số:') || nextLine.startsWith('Số:')) {
        docNumber = nextLine.replace(/\*\*/g, '').trim();
        i++;
      }
      if (dateLine.startsWith('*') || dateLine.includes('Hà Nội') || dateLine.includes('ngày') || dateLine.includes('Địa danh')) {
        dateStr = dateLine.replace(/\*/g, '').trim();
        i++;
      }

      htmlParts.push(`
        <table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 24px;">
          <tbody>
            <tr style="border: none;">
              <td style="width: 48%; vertical-align: top; text-align: center; border: none; padding: 4px;">
                <p style="text-align: center; margin: 0; font-weight: bold; font-size: 13pt; text-transform: uppercase;">${companyName}</p>
                ${docNumber ? `<p style="text-align: center; margin: 3px 0 0 0; font-size: 12pt;"><strong>${docNumber}</strong></p>` : ''}
                <hr style="width: 40%; margin: 6px auto; border-top: 1px solid #475569;"/>
              </td>
              <td style="width: 52%; vertical-align: top; text-align: center; border: none; padding: 4px;">
                <p style="text-align: center; margin: 0; font-weight: bold; font-size: 12pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p style="text-align: center; margin: 2px 0; font-size: 13pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</p>
                <hr style="width: 45%; margin: 6px auto; border-top: 1px solid #475569;"/>
                ${dateStr ? `<p style="text-align: center; margin: 4px 0 0 0; font-style: italic; font-size: 12pt;">${dateStr}</p>` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      `);
      i++;
      continue;
    }

    // Main Document Title (QUYẾT ĐỊNH / TỜ TRÌNH / HỢP ĐỒNG / NGHỊ QUYẾT / THỎA THUẬN / CÔNG VĂN)
    if (
      line.startsWith('# ') ||
      (line.startsWith('## ') &&
        (line.includes('QUYẾT ĐỊNH') ||
          line.includes('TỜ TRÌNH') ||
          line.includes('HỢP ĐỒNG') ||
          line.includes('NGHỊ QUYẾT') ||
          line.includes('THỎA THUẬN') ||
          line.includes('THÔNG BÁO') ||
          line.includes('CÔNG VĂN')))
    ) {
      const docTypeTitle = line.replace(/^#+\s*/, '').trim();
      htmlParts.push(`
        <h2 style="text-align: center; font-size: 16pt; font-weight: bold; margin: 24px 0 8px 0; text-transform: uppercase; color: #0f172a;">
          ${docTypeTitle}
        </h2>
      `);
      i++;
      continue;
    }

    // Subtitle / Trích yếu (Về việc...)
    if (line.startsWith('## ') || line.startsWith('Về việc') || line.startsWith('**Và Thỏa thuận')) {
      const subtitle = line.replace(/^##\s*/, '').trim();
      htmlParts.push(`
        <p style="text-align: center; font-size: 14pt; font-weight: bold; margin: 0 0 20px 0; color: #1e293b;">
          ${formatInlineText(subtitle)}
        </p>
      `);
      i++;
      continue;
    }

    // Doc Number stand-alone line (**Số: ...**)
    if (line.startsWith('**Số:') || line.startsWith('Số:')) {
      htmlParts.push(`
        <p style="text-align: center; font-size: 13pt; font-weight: bold; margin: 0 0 16px 0;">
          ${formatInlineText(line)}
        </p>
      `);
      i++;
      continue;
    }

    // Authority heading (TỔNG GIÁM ĐỐC / HỘI ĐỒNG QUẢN TRỊ / THỦ TRƯỞNG...)
    if (
      line.startsWith('### ') &&
      (line.includes('GIÁM ĐỐC') ||
        line.includes('CHỦ TỊCH') ||
        line.includes('BỘ TRƯỞNG') ||
        line.includes('HỘI ĐỒNG') ||
        line.includes('THỦ TRƯỞNG'))
    ) {
      const authority = line.replace(/^###\s*/, '').trim();
      htmlParts.push(`
        <p style="text-align: center; font-size: 13pt; font-weight: bold; margin: 16px 0; text-transform: uppercase; color: #0f172a;">
          ${authority}
        </p>
      `);
      i++;
      continue;
    }

    // Recipient Heading (**Kính gửi:** ...)
    if (line.startsWith('**Kính gửi:**') || line.startsWith('Kính gửi:')) {
      htmlParts.push(`
        <p style="font-weight: bold; font-size: 13pt; margin: 16px 0 12px 0; text-indent: 1.27cm;">
          ${formatInlineText(line)}
        </p>
      `);
      i++;
      continue;
    }

    // Action heading (QUYẾT ĐỊNH:, QUYẾT NGHỊ:, THỎA THUẬN CÁC ĐIỀU KHOẢN:)
    if (
      line.includes('QUYẾT ĐỊNH:') ||
      line.includes('QUYẾT NGHỊ:') ||
      line.includes('THỎA THUẬN CÁC ĐIỀU KHOẢN:') ||
      line.includes('ĐIỀU KHOẢN THỎA THUẬN:')
    ) {
      const actionText = line.replace(/^###\s*/, '').trim();
      htmlParts.push(`
        <p style="text-align: center; font-weight: bold; font-size: 14pt; margin: 20px 0 12px 0; text-transform: uppercase;">
          ${actionText}
        </p>
      `);
      i++;
      continue;
    }

    // Section Headings (### I. ..., ### II. ..., ### III. ...)
    if (/^###\s+[IVXLCDM]+\.\s+/.test(line)) {
      const romanHeading = line.replace(/^###\s*/, '').trim();
      htmlParts.push(`
        <h3 style="font-size: 13pt; font-weight: bold; margin: 18px 0 6px 0; color: #0f172a; text-transform: uppercase;">
          ${romanHeading}
        </h3>
      `);
      i++;
      continue;
    }

    // Contract Parties (### BÊN A: ..., ### BÊN B: ...)
    if (line.startsWith('### BÊN A') || line.startsWith('### BÊN B') || line.startsWith('**BÊN A') || line.startsWith('**BÊN B')) {
      const party = line.replace(/^###\s*/, '').trim();
      htmlParts.push(`
        <p style="font-weight: bold; font-size: 13pt; margin: 14px 0 4px 0; text-transform: uppercase;">
          ${formatInlineText(party)}
        </p>
      `);
      i++;
      continue;
    }

    // Legal Basis (- *Căn cứ...*)
    if (
      line.startsWith('- *Căn cứ') ||
      line.startsWith('*Căn cứ') ||
      line.startsWith('- Căn cứ') ||
      line.startsWith('Căn cứ ') ||
      line.startsWith('- *Xét') ||
      line.startsWith('Xét ') ||
      line.startsWith('- *Theo đề nghị') ||
      line.startsWith('Theo đề nghị')
    ) {
      const cleaned = line.replace(/^-\s*/, '').replace(/\*/g, '').trim();
      htmlParts.push(`
        <p style="font-style: italic; font-size: 13pt; margin: 6px 0; text-align: justify; text-indent: 1.27cm; line-height: 1.5;">
          - ${cleaned}
        </p>
      `);
      i++;
      continue;
    }

    // Article paragraphs (**Điều 1.** ..., Điều 1. ...)
    if (line.startsWith('**Điều ') || line.startsWith('Điều ') || line.startsWith('### Điều ')) {
      const articleText = line.replace(/^###\s*/, '').trim();
      htmlParts.push(`
        <p style="font-size: 13pt; margin: 10px 0; text-align: justify; text-indent: 1.27cm; line-height: 1.5;">
          ${formatInlineText(articleText)}
        </p>
      `);
      i++;
      continue;
    }

    // Standard paragraph
    htmlParts.push(`
      <p style="font-size: 13pt; margin: 8px 0; text-align: justify; line-height: 1.5; ${line.startsWith('- ') ? 'text-indent: 1.27cm;' : ''}">
        ${formatInlineText(line)}
      </p>
    `);
    i++;
  }

  if (inTable) {
    flushTable();
  }

  return htmlParts.join('\n');
}

/** Formats bold, italic, and underline markdown inside a line */
function formatInlineText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>');
}
