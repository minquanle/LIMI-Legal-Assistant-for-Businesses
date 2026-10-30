import { ASTNodeType } from './types';
export interface ParsedNode {
  id: string;
  nodeType: ASTNodeType;
  ordinal: string;
  heading: string;
  content: string;
  children: ParsedNode[];
}

export interface ParsedLegalDocument {
  header?: {
    issuingBody?: string;
    documentNumber?: string;
    locationDate?: string;
  };
  docType?: string;
  docSubject?: string;
  preambles: string[];
  enactingClause?: string;
  astNodes: ParsedNode[];
  footer?: {
    recipients: string[];
    signerPrefix?: string;
    signerRole?: string;
    signerTitle?: string;
    signerSignedMark?: string;
    signerName?: string;
  };
  isParsed: boolean;
  rawBodyText?: string;
}

// Vietnamese Unicode Letter Pattern
const VIET_CHARS = "a-zA-Zà-ýÀ-ÝđĐ\u00C0-\u024F\u1EA0-\u1EF9";

// Words that typically precede a cross-reference (normalized to ASCII)
const REF_PREDECESSORS = [
  'tai', 'theo', 'boi', 'cua', 'doi voi', 'va', 'hoac', 'khoan', 'diem', 'nhu', 'o', 'den', 'toi', 'tu', 'trong',
  'phan', 'chuong', 'muc', 'dieu',
  'sau', 'truoc', 'giua', 'bo sung', 'thay', 'thay the', 'bai bo', 'sua doi',
  'can cu', 'ban hanh', 'noi dung'
];

function stripDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

const PATTERNS = [
  { type: ASTNodeType.PHU_LUC, regex: /(?<=^|[\s\.\;\:\_\-\n])(Phụ\s+lục\s+(?:[IVXLC]+|\d+|[A-Z]))([\.\:\s]+)/gi },
  { type: ASTNodeType.PHAN, regex: /(?<=^|[\s\.\;\:\_\-\n])(Phần\s+(?:thứ\s+)?(?:nhất|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|[IVXLC]+|\d+))([\.\:\s]+)/gi },
  { type: ASTNodeType.CHUONG, regex: /(?<=^|[\s\.\;\:\_\-\n])(Chương\s+(?:[IVXLC]+|\d+))([\.\:\s]+)/gi },
  { type: ASTNodeType.MUC, regex: /(?<=^|[\s\.\;\:\_\-\n])(Mục\s+(?:\d+))([\.\:\s]+)/gi },
  { type: ASTNodeType.DIEU, regex: /(?<=^|[\s\.\;\:\_\-\n])(Điều\s+\d+[a-z]?)([\.\:\s]+)/gi }
];

const NODE_HIERARCHY: Record<ASTNodeType, number> = {
  PHU_LUC: 0,
  PHAN: 1,
  CHUONG: 2,
  MUC: 3,
  DIEU: 4,
  KHOAN: 5,
  DIEM: 6,
};

function isValidParent(parentType: ASTNodeType, childType: ASTNodeType): boolean {
  if (parentType === 'PHU_LUC') return true;
  return NODE_HIERARCHY[parentType] < NODE_HIERARCHY[childType];
}

function isCrossRef(text: string, matchIndex: number, matchLength: number, nodeType?: ASTNodeType): boolean {
  // 1. Check preceding text for reference predecessor words
  const precedingText = text.substring(Math.max(0, matchIndex - 80), matchIndex);
  const cleanPreceding = stripDiacritics(precedingText); // Do not trim to preserve newlines
  
  for (const pred of REF_PREDECESSORS) {
    // For PHU_LUC, PDF extractions often leave large gaps (double newlines) before the Phụ Lục heading.
    // Allow up to 2 newlines if it's a PHU_LUC node to catch "theo\n\nPHỤ LỤC 04".
    const newlineQuantifier = nodeType === ASTNodeType.PHU_LUC ? '{0,2}' : '?';
    const predRegex = new RegExp(`(?:^|[\\s\\.\\,\\;\\:\\_\\-\\(\)])` + pred + `(?:\\s+(?:(?:[IVXLC]+)|\\d+[a-z]?))?[ \\t\\,\\;\\_\\-]*(?:\\n[ \\t\\,\\;\\_\\-]*)${newlineQuantifier}\\.?$`, 'i');
    if (predRegex.test(cleanPreceding)) {
      return true;
    }
  }

  // 2. Check succeeding text for law/document-name references
  //    Must be separated by spaces, commas, or newlines (no periods or colons to avoid matching headings like "Điều 2. Luật...")
  const succeedingText = text.substring(matchIndex + matchLength, matchIndex + matchLength + 60);
  const cleanSucceeding = stripDiacritics(succeedingText);
  
  // 2a. Direct safe law name reference: "Điều X Luật/Nghị định/Bộ luật..."
  const lawNameRefRegex = /^[\s,\-\n]+(?:cua\s+)?(?:luat|nghi dinh|phap lenh|thong tu|bo luat|hien phap|hiep dinh|dieu uoc)/i;
  if (lawNameRefRegex.test(cleanSucceeding)) {
    return true;
  }
  
  // 2b. Reference requiring "của" preposition for other document types (quy định, quy chế, quyết định...)
  const selfRefRegex = /^[\s,\-\n]+(?:cua\s+)(?:luat|nghi dinh|phap lenh|thong tu|bo luat|hien phap|quyet dinh|nghi quyet|quy che|quy dinh|hiep dinh|dieu uoc|dieu le)/i;
  if (selfRefRegex.test(cleanSucceeding)) {
    return true;
  }
  
  // 2c. "này" reference: "Điều X này"
  const thisRefRegex = /^[\s,\-\n]+(?:nay\b)/i;
  if (thisRefRegex.test(cleanSucceeding)) {
    return true;
  }

  // 3. Check if preceded by open quote (indicating quoted content in amending laws)
  if (/["\u201C\u2018']\s*$/.test(cleanPreceding)) {
    return true;
  }

  // 4. Check if preceded by a number list pattern (e.g., "1, 2, 3, 5, 6 Điều X")
  //    This catches patterns like "...tại các khoản 1, 3, 5, 6 Điều 78 Luật..."
  if (/\d+[,\s]*$/.test(cleanPreceding) && /(?:khoan|diem|doan)\s/.test(cleanPreceding)) {
    return true;
  }

  return false;
}

function isClauseCrossRef(text: string, matchIndex: number): boolean {
  const precedingText = text.substring(Math.max(0, matchIndex - 15), matchIndex);
  const cleanPreceding = stripDiacritics(precedingText).trim();
  
  const CLAUSE_REF_PREDECESSORS = [
    'khoan', 'dieu', 'diem', 'tai', 'theo', 'cua', 'va', 'hoac', 'den', 'tu'
  ];

  for (const pred of CLAUSE_REF_PREDECESSORS) {
    const regex = new RegExp(`(?:^|[\\s\\.\\,\\;\\:\\_\\-\\(\\)])${pred}(?:\\s+\\d+[a-z]?)?\\s*$`, 'i');
    if (regex.test(cleanPreceding)) {
      return true;
    }
  }
  return false;
}

function parseHierarchy(text: string): ParsedNode[] {
  let matches: Array<{ index: number; fullMatchStr: string; prefix: string; separator: string; type: ASTNodeType }> = [];
  
  for (const pat of PATTERNS) {
    let match;
    while ((match = pat.regex.exec(text)) !== null) {
      const fullMatchStr = match[0];
      const prefix = match[1];
      const separator = match[2];
      const matchIndex = match.index + fullMatchStr.indexOf(prefix);
      
      if (!isCrossRef(text, matchIndex, prefix.length, pat.type)) {
        matches.push({ index: matchIndex, fullMatchStr, prefix, separator, type: pat.type });
      }
    }
  }
  
  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);
  
  // Filter out overlapping matches (e.g., if multiple regexes matched at same place)
  const filteredMatches = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.index >= lastEnd) {
      filteredMatches.push(m);
      lastEnd = m.index + m.prefix.length;
    }
  }
  
  if (filteredMatches.length === 0) {
    return [{
      id: 'node-fallback',
      nodeType: ASTNodeType.DIEU,
      ordinal: '',
      heading: '',
      content: text,
      children: []
    }];
  }

  const rootNodes: ParsedNode[] = [];
  const stack: Array<{ node: ParsedNode; type: ASTNodeType }> = [];
  let nodeCounter = 0;

  for (let i = 0; i < filteredMatches.length; i++) {
    const m = filteredMatches[i];
    const nextM = i + 1 < filteredMatches.length ? filteredMatches[i + 1] : null;
    
    // Extract the raw text for this node
    const startTextIndex = m.index + m.prefix.length + m.separator.length;
    const endTextIndex = nextM ? nextM.index : text.length;
    let nodeRawText = text.substring(startTextIndex, endTextIndex).trim();

    let heading = m.prefix;
    let restContent = nodeRawText;

    const isStructuralGroup = ['PHU_LUC', 'PHAN', 'CHUONG', 'MUC'].includes(m.type);

    const newlineIdx = restContent.indexOf('\n');
    if (newlineIdx !== -1 && newlineIdx < 200) {
      const headingPart = restContent.substring(0, newlineIdx).trim();
      const bodyPart = restContent.substring(newlineIdx + 1).trim();
      heading = `${m.prefix}${m.separator}${headingPart}`;
      restContent = bodyPart;
    } else if (restContent.length < 200) {
      // Very short, just use as heading
      heading = `${m.prefix}${m.separator}${restContent.replace(/\n+/g, ' ')}`;
      restContent = '';
    }

    const ordinalStr = m.prefix.split(/\s+/).pop() || '';

    const newNode: ParsedNode = {
      id: `${m.type.toLowerCase()}-${nodeCounter++}`,
      nodeType: m.type,
      ordinal: ordinalStr,
      heading,
      content: restContent,
      children: []
    };

    // Sub-parse KHOAN and DIEM for DIEU nodes
    if (m.type === 'DIEU' && restContent) {
      newNode.children = parseClausesAndPoints(restContent, newNode.id);
      if (newNode.children.length > 0) {
        newNode.content = ''; // Content is moved to children
      }
    }

    while (stack.length > 0 && !isValidParent(stack[stack.length - 1].type, m.type)) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].node.children.push(newNode);
    } else {
      rootNodes.push(newNode);
    }
    stack.push({ node: newNode, type: m.type });
  }

  return rootNodes;
}

function parseClausesAndPoints(text: string, parentId: string): ParsedNode[] {
  const clauseRegex = /(?<=^|[\s\.\;\:\_\-\n\"\'“”])(\d{1,3})\.\s+/g;
  let clauseMatches = [];
  let cmatch;
  
  while ((cmatch = clauseRegex.exec(text)) !== null) {
    const matchIndex = cmatch.index;
    if (!isClauseCrossRef(text, matchIndex)) {
      clauseMatches.push({ index: matchIndex, prefix: `${cmatch[1]}. `, ordinal: cmatch[1] });
    }
  }

  if (clauseMatches.length === 0) return [];

  const clauses: ParsedNode[] = [];
  const seenOrdinals = new Set<string>();

  for (let i = 0; i < clauseMatches.length; i++) {
    const m = clauseMatches[i];
    const nextM = i + 1 < clauseMatches.length ? clauseMatches[i + 1] : null;
    const startIdx = m.index + m.prefix.length;
    const endIdx = nextM ? nextM.index : text.length;
    const clauseText = text.substring(startIdx, endIdx).trim();

    let baseId = `${parentId}-khoan-${m.ordinal}`;
    let finalId = baseId;
    let suffixCounter = 1;
    while (seenOrdinals.has(finalId)) {
      finalId = `${baseId}-${suffixCounter}`;
      suffixCounter++;
    }
    seenOrdinals.add(finalId);

    const newClause: ParsedNode = {
      id: finalId,
      nodeType: ASTNodeType.KHOAN,
      ordinal: m.ordinal,
      heading: '',
      content: clauseText,
      children: []
    };

    // Sub-parse points (Điểm a, b, c...)
    newClause.children = parsePoints(clauseText, newClause.id);
    if (newClause.children.length > 0) {
       newClause.content = clauseText.substring(0, newClause.children[0].content.length).trim(); 
    }
    
    clauses.push(newClause);
  }
  return clauses;
}

function parsePoints(text: string, parentId: string): ParsedNode[] {
  const pointRegex = /(?<=^|[\s\.\;\:\_\-\n\"\'“”])([a-zđ])\)\s+/g;
  let pointMatches = [];
  let pmatch;

  while ((pmatch = pointRegex.exec(text)) !== null) {
    const matchIndex = pmatch.index;
    if (!isClauseCrossRef(text, matchIndex)) {
      pointMatches.push({ index: matchIndex, prefix: `${pmatch[1]}) `, ordinal: pmatch[1] });
    }
  }

  if (pointMatches.length === 0) return [];

  const points: ParsedNode[] = [];
  const seenOrdinals = new Set<string>();

  for (let i = 0; i < pointMatches.length; i++) {
    const m = pointMatches[i];
    const nextM = i + 1 < pointMatches.length ? pointMatches[i + 1] : null;
    const startIdx = m.index + m.prefix.length;
    const endIdx = nextM ? nextM.index : text.length;
    
    let baseId = `${parentId}-diem-${m.ordinal}`;
    let finalId = baseId;
    let suffixCounter = 1;
    while (seenOrdinals.has(finalId)) {
      finalId = `${baseId}-${suffixCounter}`;
      suffixCounter++;
    }
    seenOrdinals.add(finalId);
    
    points.push({
      id: finalId,
      nodeType: ASTNodeType.DIEM,
      ordinal: m.ordinal,
      heading: '',
      content: text.substring(startIdx, endIdx).trim(),
      children: []
    });
  }

  return points;
}

function normalizeSpacing(text: string): string {
  // 1. Normalize spaces in numeric ordinals, e.g. "Điều 3 2" -> "Điều 32"
  const numRegex = new RegExp(`(?:^|[\\s\\.\\;\\:\\_\\-\\n\\(\\)])(Điều|Chương|Mục|Phần|Khoản|khoản)\\s+(\\d+(?:\\s+\\d+)*(?:\\s+[a-zđ](?![${VIET_CHARS}]))?)`, 'gi');
  text = text.replace(numRegex, (match, g1, g2) => {
    const firstChar = match.charAt(0);
    const prefix = /^[a-zA-Z0-9]$/.test(firstChar) ? '' : (match.startsWith(g1) ? '' : firstChar);
    return prefix + g1 + ' ' + g2.replace(/\s+/g, '');
  });

  // 2. Normalize spaces in Roman ordinals, e.g. "Chương I I" -> "Chương II"
  const romanRegex = new RegExp(`(?:^|[\\s\\.\\?\\!\\;\\:\\_\\-\\n\\(\\)])(Chương|Phần)\\s+([ivxlcdm]+(?:\\s+[ivxlcdm]+)*(?![${VIET_CHARS}]))`, 'gi');
  text = text.replace(romanRegex, (match, g1, g2) => {
    const firstChar = match.charAt(0);
    const prefix = /^[a-zA-Z0-9]$/.test(firstChar) ? '' : (match.startsWith(g1) ? '' : firstChar);
    return prefix + g1 + ' ' + g2.replace(/\s+/g, '').toUpperCase();
  });

  return text;
}

/**
 * Parses raw legal document text into structured components
 */
export function parseLegalText(fullText: string): ParsedLegalDocument {
  if (!fullText || fullText.trim() === '' || fullText === 'nan' || fullText === 'null') {
    return { preambles: [], astNodes: [], isParsed: false };
  }

  let text = fullText.replace(/\r\n/g, '\n').trim();
  text = normalizeSpacing(text);

  // 1. Extract Nơi nhận recipients and Signer info
  let recipients: string[] = [];
  let signerPrefix = '';
  let signerRole = '';
  let signerSignedMark = '';
  let signerName = '';
  let bodyTextOnly = text;
  
  const noiNhanMatch = text.match(/(?:^|\n)([^\n]*?Nơi nhận\s*\:\s*)/i);
  if (noiNhanMatch && noiNhanMatch.index !== undefined) {
    const hasNewline = noiNhanMatch[0].startsWith('\n');
    const footerStartIndex = noiNhanMatch.index + (hasNewline ? 1 : 0);
    bodyTextOnly = text.substring(0, footerStartIndex).trim();
    
    const footerChunk = text.substring(footerStartIndex);
    const signerRegex = /(KT\.\s*CHỦ TỊCH|TM\.\s*CHÍNH PHỦ|TM\.\s*ỦY BAN NHÂN DÂN|TM\.\s*HỘI ĐỒNG NHÂN DÂN|KT\.\s*BỘ TRƯỞNG|BỘ TRƯỞNG|KT\.\s*GIÁM ĐỐC|THỦ TƯỚNG|KT\.\s*THỦ TƯỚNG)?\s*(PHÓ CHỦ TỊCH|CHỦ TỊCH|THỦ TƯỚNG|PHÓ THỦ TƯỚNG|BỘ TRƯỞNG|THỨ TRƯỞNG|GIÁM ĐỐC|PHÓ GIÁM ĐỐC|Q\. BỘ TRƯỞNG|Q\. CHỦ TỊCH|TỔNG GIÁM ĐỐC|PHÓ TỔNG GIÁM ĐỐC|TRƯỞNG BAN|PHÓ TRƯỞNG BAN)\s*(\(Đã ký\)|Đã ký|\[daky\]|\[đã ký\])?\s*([\s\S]*)/i;
    
    let recipientsChunk = footerChunk;
    let signerChunk = '';
    
    // 1. If it's a table layout, split by cells to isolate the signature block from Nơi nhận cell
    const footerLines = footerChunk.split('\n');
    const firstFooterLine = footerLines[0];
    if (firstFooterLine.includes('|')) {
      const parts = firstFooterLine.split('|');
      if (parts.length >= 3) {
        recipientsChunk = parts[1];
        signerChunk = parts.slice(2).join(' | ');
      }
    }
    
    // 2. If it's a linear layout, search from bottom to top to locate signature block
    if (!signerChunk) {
      let signerLineIdx = -1;
      for (let i = footerLines.length - 1; i >= 0; i--) {
        const line = footerLines[i].trim();
        const isBullet = /^[\s\-\•\*|]*[\-\•\*]/.test(line);
        const isSeparator = /^[\s\-:|]+$/.test(line);
        if (isBullet || isSeparator) continue;
        
        const match = line.match(signerRegex);
        if (match) {
          signerLineIdx = i;
          break;
        }
      }
      
      if (signerLineIdx !== -1) {
        recipientsChunk = footerLines.slice(0, signerLineIdx).join('\n');
        signerChunk = footerLines.slice(signerLineIdx).join('\n');
      } else {
        // Fallback: search forwards
        const match = footerChunk.match(signerRegex);
        if (match && match.index !== undefined) {
          recipientsChunk = footerChunk.substring(0, match.index);
          signerChunk = footerChunk.substring(match.index);
        }
      }
    }
    
    const signerMatch = signerChunk.match(signerRegex);
    if (signerMatch) {
       signerPrefix = signerMatch[1] ? signerMatch[1].trim().replace(/^\|+|\|+$/g, '').trim() : '';
       signerRole = signerMatch[2] ? signerMatch[2].trim().replace(/^\|+|\|+$/g, '').trim() : '';
       signerSignedMark = signerMatch[3] ? signerMatch[3].trim().replace(/^\|+|\|+$/g, '').trim() : '';
       signerName = signerMatch[4] ? signerMatch[4].trim().replace(/^\|+|\|+$/g, '').trim() : '';
    }
    
    recipients = recipientsChunk
      .split(/(?:;\s*|\n+)/)
      .map(s => {
        let clean = s.trim();
        clean = clean.replace(/^\|+|\|+$/g, '').trim();
        clean = clean.replace(/^[\-\•\*\s]+/, '').replace(/^Nơi nhận\s*\:\s*/i, '').trim();
        clean = clean.replace(/^[\-\•\*\s]+/, '').trim();
        clean = clean.replace(/^\|+|\|+$/g, '').trim();
        return clean;
      })
      .filter(s => s.length > 1 && s.length < 100 && !/^[\s\-:|]+$/.test(s));
  }

  // Find first structural node to separate topText
  let firstMatchIndex = bodyTextOnly.length;
  for (const pat of PATTERNS) {
      let match;
      while ((match = pat.regex.exec(bodyTextOnly)) !== null) {
          const fullMatchStr = match[0];
          const prefix = match[1];
          const matchIndex = match.index + fullMatchStr.indexOf(prefix);
          
          if (!isCrossRef(bodyTextOnly, matchIndex, prefix.length, pat.type)) {
              if (match.index < firstMatchIndex) {
                  firstMatchIndex = match.index;
              }
              break; // Stop at first non-crossref match for this pattern
          }
      }
      pat.regex.lastIndex = 0; // reset
  }

  const topText = bodyTextOnly.substring(0, firstMatchIndex).trim();
  const bodyText = bodyTextOnly.substring(firstMatchIndex).trim();

  const astNodes = bodyText ? parseHierarchy(bodyText) : [];

  // Extract Preambles from topText
  let issuingBody = '';
  let docNumber = '';
  let locationDate = '';
  let docType = '';
  let docSubject = '';
  let preambles: string[] = [];
  let enactingClause = '';

  const canCuMatch = topText.match(/(?:^|[\s\.\;\:\_\-])Căn cứ\s+/i);
  let headerTitleArea = topText;
  let preambleArea = '';

  if (canCuMatch && canCuMatch.index !== undefined) {
    headerTitleArea = topText.substring(0, canCuMatch.index).trim();
    preambleArea = topText.substring(canCuMatch.index).trim();
  }

  const numMatch = headerTitleArea.match(/Số\s*\:\s*([^\s,;]+|\S+\/\S+)/i);
  if (numMatch) docNumber = numMatch[1];

  const dateRegex = new RegExp(`([${VIET_CHARS}\\s]+,\\s*ngày\\s+\\d+\\s+tháng\\s+\\d+\\s+năm\\s+\\d+)`, "i");
  const dateMatch = headerTitleArea.match(dateRegex);
  if (dateMatch) locationDate = dateMatch[1];

  const congHoaMatch = headerTitleArea.match(/CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i);
  if (congHoaMatch && congHoaMatch.index !== undefined) {
    issuingBody = headerTitleArea.substring(0, congHoaMatch.index).replace(/[\-\_\s]+$/, '').trim();
  }

  const typeRegex = /(?:^|[\s\.\;\:\_\-])(QUYẾT ĐỊNH|NGHỊ ĐỊNH|LUẬT|THÔNG TƯ|CHỈ THỊ|NGHỊ QUYẾT|LỆNH|CÔNG VĂN)/i;
  const typeMatch = headerTitleArea.match(typeRegex);
  if (typeMatch && typeMatch.index !== undefined) {
    docType = typeMatch[1].toUpperCase();
    docSubject = headerTitleArea.substring(typeMatch.index + typeMatch[0].length).trim();
  }

  if (preambleArea) {
    const banHanhMatch = preambleArea.match(/((?:Chủ tịch|Ủy ban|Bộ trưởng|Chính phủ|Thủ tướng|Hội đồng)[^;\n\.]*?(?:ban hành|quy định|quyết định)[^;\n\.]*?[\.:])/i);
    let preamblesRaw = preambleArea;
    if (banHanhMatch && banHanhMatch.index !== undefined) {
      enactingClause = banHanhMatch[1].trim();
      preamblesRaw = preambleArea.substring(0, banHanhMatch.index).trim();
    }
    preambles = preamblesRaw.split(/(?:;\s*|\n+)/).map(s => s.trim()).filter(s => s.length > 5);
  }

  const isParsed = Boolean((issuingBody || docType || docNumber) && (astNodes.length > 0 || preambles.length > 0));

  return {
    header: { issuingBody, documentNumber: docNumber, locationDate },
    docType,
    docSubject,
    preambles,
    enactingClause,
    astNodes,
    footer: { recipients, signerPrefix, signerRole, signerSignedMark, signerName },
    isParsed,
    rawBodyText: bodyText,
  };
}
 
export function flattenAST(
  nodes: ParsedNode[],
  parentPath: string = ''
): Array<ParsedNode & { path: string; depth: number; orderIndex: number }> {
  const result: Array<ParsedNode & { path: string; depth: number; orderIndex: number }> = [];
  let orderIndex = 0;

  function walk(node: ParsedNode, currentPath: string, depth: number) {
    const nodePath = currentPath
      ? `${currentPath}.${node.nodeType.toLowerCase()}-${node.ordinal}`
      : `${node.nodeType.toLowerCase()}-${node.ordinal}`;

    result.push({
      ...node,
      path: nodePath,
      depth,
      orderIndex: orderIndex++,
    });

    for (const child of node.children) {
      walk(child, nodePath, depth + 1);
    }
  }

  for (const node of nodes) {
    walk(node, parentPath, 0);
  }

  return result;
}
