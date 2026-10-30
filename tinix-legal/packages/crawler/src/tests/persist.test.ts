import { describe, it, expect, vi, beforeEach } from 'vitest';

const txState = {
  upsertCalls: [] as any[],
  deleteManyCalls: [] as any[],
  createManyCalls: [] as any[],
};

const txStub = {
  canonicalDocument: {
    upsert: vi.fn(async ({ where, create }: any) => {
      txState.upsertCalls.push({ where, create });
      return { id: 'doc-1', documentNumber: create?.documentNumber ?? 'existing' };
    }),
    findUnique: vi.fn(async () => null as any),
    findMany: vi.fn(async () => [] as any[]),
  },
  $queryRaw: vi.fn(async () => []),
  documentSource: {
    findMany: vi.fn(async () => [] as any[]),
    update: vi.fn(async () => ({})),
    create: vi.fn(async () => ({})),
  },
  legalASTNode: {
    deleteMany: vi.fn(async (args: any) => {
      txState.deleteManyCalls.push(args);
      return { count: 0 };
    }),
    createMany: vi.fn(async (args: any) => {
      txState.createManyCalls.push(args);
      return { count: args.data.length };
    }),
  },
  documentRelation: {
    findMany: vi.fn(async () => []),
    deleteMany: vi.fn(async () => ({ count: 0 })),
    create: vi.fn(async () => ({})),
  },
};

let transactionCallCount = 0;

vi.mock('@prisma/client', () => ({
  // Must be a `function`, not an arrow function — persist.ts calls
  // `new PrismaClient()`, and arrow functions can't be used as constructors.
  PrismaClient: vi.fn().mockImplementation(function (this: any) {
    this.$transaction = vi.fn(async (cb: any) => {
      transactionCallCount++;
      return cb(txStub);
    });
  }),
  Prisma: {},
}));

import { persistDocument } from '../pipeline/persist.js';
import { extractMetadataFromRaw } from '../parsers/metadata-parser.js';

describe('persistDocument', () => {
  beforeEach(() => {
    transactionCallCount = 0;
    txState.upsertCalls = [];
    txState.deleteManyCalls = [];
    txState.createManyCalls = [];
    vi.clearAllMocks();
    txStub.canonicalDocument.findUnique.mockResolvedValue(null);
    txStub.canonicalDocument.findMany.mockResolvedValue([]);
    txStub.documentSource.findMany.mockResolvedValue([]);
  });

  it('wraps the CanonicalDocument upsert and AST node replace in a single $transaction — the P0 fix for the "0 AST nodes after a crash mid-write" bug', async () => {
    const metadata = extractMetadataFromRaw(
      { documentNumber: '31/2024/QH15', documentType: 'Luật', issuingBody: 'Quốc hội' },
      'Luật Bảo hiểm xã hội'
    );

    const flattenedNodes = [
      { nodeType: 'DIEU', ordinal: '1', heading: 'Điều 1', content: 'nội dung', path: '1', depth: 0, orderIndex: 0 },
      { nodeType: 'DIEU', ordinal: '2', heading: 'Điều 2', content: 'nội dung khác', path: '2', depth: 0, orderIndex: 1 },
    ];

    const doc = await persistDocument({ url: 'https://vbpl.vn/x', fullText: 'nội dung' }, metadata, 'nội dung', [], flattenedNodes);

    expect(transactionCallCount).toBe(1);
    expect(doc.id).toBe('doc-1');

    // AST replace happens inside the same transaction call as the upsert —
    // both ran as part of the single cb(txStub) invocation above.
    expect(txState.deleteManyCalls).toHaveLength(1);
    expect(txState.createManyCalls).toHaveLength(1);
    expect(txState.createManyCalls[0].data).toHaveLength(2);
  });

  it('uses source identity rather than number/type/issuer when no explicit id is given', async () => {
    const metadata = extractMetadataFromRaw(
      { documentNumber: '31/2024/QH15', documentType: 'Luật', issuingBody: 'Quốc hội' },
      'Luật Bảo hiểm xã hội'
    );

    await persistDocument({ url: 'https://vbpl.vn/x' }, metadata, 'nội dung', [], []);

    const { where } = txState.upsertCalls[0];
    expect(where.id).toBeTruthy();
    expect(Object.keys(where)).toEqual(['id']);
    expect(txStub.documentSource.create).toHaveBeenCalled();
  });

  it('actually writes issuingBodyCode in the create/update payload, matching the value used in the where clause — regression test for a live bug found via manual smoke testing: issuingBodyCode was previously never written on create (silently defaulted to \'\' by the schema), so the upsert could never find the row it had just created and every re-ingest of the same document either drifted toward duplicate rows or collided on the unique constraint', async () => {
    const metadata = extractMetadataFromRaw(
      { documentNumber: '1/2024/QD-CP', documentType: 'Quyết định', issuingBody: 'Chính phủ' },
      'Quyết định X'
    );

    await persistDocument({ url: 'https://chinhphu.vn/x' }, metadata, 'nội dung', [], []);

    const { where, create } = txState.upsertCalls[0];
    expect(where.id).toBe(create.id);
    expect(create.issuingBodyCode).toBe(metadata.issuingBodyCode);
    expect(create.issuingBodyCode).toBeTruthy();
  });

  it('skips the AST replace entirely when there are no flattened nodes', async () => {
    const metadata = extractMetadataFromRaw({ documentNumber: '1/2024/NĐ-CP', documentType: 'Nghị định', issuingBody: 'Chính phủ' }, 'Nghị định X');
    await persistDocument({ url: 'https://vbpl.vn/y' }, metadata, 'nội dung', [], []);
    expect(txState.deleteManyCalls).toHaveLength(0);
    expect(txState.createManyCalls).toHaveLength(0);
  });

  it('reuses a known source owner and never overwrites a document selected from version history', async () => {
    const metadata=extractMetadataFromRaw({documentNumber:'1/2024/NĐ-CP',documentType:'Nghị định',issuingBody:'Chính phủ'},'Nghị định X');
    txStub.documentSource.findMany.mockResolvedValue([{id:'source-1',documentId:'stable-doc'}]);
    await persistDocument({url:'https://vbpl.vn/y'},metadata,'nội dung',[],[]);
    expect(txState.upsertCalls[0].where).toEqual({id:'stable-doc'});
    txStub.canonicalDocument.findUnique.mockResolvedValue({selectedSnapshotId:'pinned-snapshot'});
    await expect(persistDocument({url:'https://vbpl.vn/y'},metadata,'changed',[],[])).rejects.toThrow('VERSIONED_DOCUMENT_REQUIRES_SNAPSHOT_IMPORT');
    expect(txState.upsertCalls).toHaveLength(1);
  });
  it('rejects explicit IDs that conflict with a URL owner, and refuses identity-free records', async () => {
    const metadata=extractMetadataFromRaw({documentNumber:'1/2024/NĐ-CP'},'Nghị định X');
    txStub.documentSource.findMany.mockResolvedValue([{id:'source-1',documentId:'other-document'}]);
    await expect(persistDocument({id:'different-document',url:'https://vbpl.vn/y'},metadata,'nội dung',[],[])).rejects.toThrow('SOURCE_DOCUMENT_CONFLICT');
    await expect(persistDocument({},metadata,'nội dung',[],[])).rejects.toThrow('DOCUMENT_ID_OR_SOURCE_URL_REQUIRED');
    expect(txState.upsertCalls).toHaveLength(0);
  });
  it('does not bind an extracted relation to an arbitrary matching-number document', async () => {
    const metadata=extractMetadataFromRaw({documentNumber:'1/2024/NĐ-CP'},'Nghị định X');
    metadata.relationships=[{targetDocNumber:'31/2024/QH15',normalizedTargetNumber:'31/2024/QH15',relationshipType:'CAN_CU'}] as any;
    txStub.canonicalDocument.findMany.mockResolvedValue([{id:'candidate-a'},{id:'candidate-b'}]);
    await persistDocument({url:'https://vbpl.vn/y'},metadata,'nội dung',[],[]);
    expect(txStub.documentRelation.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({targetDocId:null,resolveStatus:'AMBIGUOUS'})}));
  });
});
