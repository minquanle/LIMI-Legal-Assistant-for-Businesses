/**
 * MindmapService
 * Phân tích và tạo cấu trúc cây (AST) từ tài liệu pháp lý,
 * Cung cấp thuật toán Tree Diff cơ bản.
 */

export class MindmapService {
  /**
   * Trả về danh sách Nodes và Edges cho Mindmap Compare
   * (Mô phỏng Tree Diff)
   */
  static async generateDiffTree(docId1: string, docId2: string) {
    // 1. (Mock) Parse văn bản thành AST
    // 2. (Mock) So sánh 2 cây AST để tìm ra các node thay đổi
    
    // Fake output cho Demo
    const nodes = [
      { 
        id: '1', 
        position: { x: 250, y: 0 }, 
        data: { label: 'Luật Đất đai (Bản mới)', status: 'modified' },
        type: 'articleNode'
      },
      { 
        id: '2', 
        position: { x: 100, y: 150 }, 
        data: { label: 'Điều 15. Phân loại đất', status: 'unchanged', content: 'Phân loại đất dựa trên mục đích sử dụng...' },
        type: 'articleNode'
      },
      { 
        id: '3', 
        position: { x: 400, y: 150 }, 
        data: { label: 'Điều 16. Nhóm đất nông nghiệp', status: 'added', content: 'Bao gồm đất trồng lúa, đất rừng phòng hộ...' },
        type: 'articleNode'
      },
      { 
        id: '4', 
        position: { x: 400, y: 300 }, 
        data: { label: 'Điều 17. Thu hồi đất', status: 'removed', content: 'Cơ quan nhà nước có quyền thu hồi đất...' },
        type: 'articleNode'
      }
    ];

    const edges = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
      { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#ef4444' } },
    ];

    return { nodes, edges };
  }
}
