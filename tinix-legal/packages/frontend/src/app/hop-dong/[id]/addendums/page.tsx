'use client';

import { useState, useEffect, useCallback, use } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileDiff,
  FileText,
  GitBranch,
  Plus,
  RefreshCw,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface AddendumItem {
  id: string;
  contractId: string;
  parentId?: string;
  title: string;
  addendumNumber: string;
  valueAdjustment?: number;
  dateAdjustment?: string;
  notes?: string;
  createdAt: string;
}

export default function ContractAddendumTreePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const contractId = resolvedParams.id;

  const [addendums, setAddendums] = useState<AddendumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [addendumNumber, setAddendumNumber] = useState('');
  const [valueAdjustment, setValueAdjustment] = useState('');
  const [dateAdjustment, setDateAdjustment] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getContractAddendums(contractId);
      setAddendums(data);
    } catch {
      /* Fallback demo addendums */
      setAddendums([
        {
          id: 'add_1',
          contractId,
          title: 'Phụ lục 01: Nâng cấp Dung lượng Đĩa cứng NVMe',
          addendumNumber: 'PL-01/CLOUD01',
          valueAdjustment: 200_000_000,
          notes: 'Nâng giá trị từ 1.2 tỷ lên 1.4 tỷ VNĐ',
          createdAt: new Date('2026-02-01').toISOString(),
        },
        {
          id: 'add_2',
          contractId,
          parentId: 'add_1',
          title: 'Phụ lục 02: Gia hạn Thời gian Sử dụng Thêm 06 Tháng',
          addendumNumber: 'PL-02/CLOUD01',
          valueAdjustment: 150_000_000,
          dateAdjustment: new Date('2027-06-30').toISOString(),
          notes: 'Gia hạn hạn hiệu lực đến 30/06/2027',
          createdAt: new Date('2026-03-01').toISOString(),
        },
      ]);
    }
    setLoading(false);
  }, [contractId]);

  useEffect(() => { load(); }, [load]);

  const handleCreateAddendum = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createContractAddendum(contractId, {
        title,
        addendumNumber,
        valueAdjustment: valueAdjustment ? parseFloat(valueAdjustment) : undefined,
        dateAdjustment: dateAdjustment || undefined,
        notes,
      });
      setShowAddModal(false);
      setTitle('');
      setAddendumNumber('');
      setValueAdjustment('');
      setDateAdjustment('');
      setNotes('');
      load();
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hop-dong" className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">ADDENDUM HIERARCHY TREE</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý Cây Phụ lục Hợp đồng</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
            >
              <FileDiff className="w-4 h-4 text-purple-600" /> So sánh Phiên bản
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Tạo Phụ lục Mới
            </button>
          </div>
        </div>

        {/* Parent Contract Root Card */}
        <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-800">HỢP ĐỒNG GỐC</span>
            <span className="text-xs font-mono text-slate-400">ID: {contractId}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Hợp đồng Thuê Máy chủ Cloud Server 2026</h2>
          <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-green-600" /> Giá trị gốc: 1.200.000.000 VNĐ</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-indigo-600" /> Hạn hiệu lực: 31/12/2026</span>
          </div>
        </div>

        {/* Addendums Tree View */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" /> Danh sách Cây Phụ lục Hợp đồng ({addendums.length})
          </h3>

          <div className="space-y-4 relative pl-4 border-l-2 border-indigo-200">
            {addendums.map((add) => (
              <div key={add.id} className="relative p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="absolute -left-6 top-6 w-4 h-0.5 bg-indigo-300" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{add.addendumNumber}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{add.title}</h4>
                  </div>
                  <span className="text-[11px] text-slate-400">{new Date(add.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-600 pt-1">
                  {add.valueAdjustment && (
                    <span className="font-semibold text-green-700">
                      Chênh lệch giá trị: +{add.valueAdjustment.toLocaleString()} VNĐ
                    </span>
                  )}
                  {add.dateAdjustment && (
                    <span className="font-semibold text-purple-700">
                      Hạn mới: {new Date(add.dateAdjustment).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {add.notes && <p className="text-xs text-slate-500 flex items-start gap-1.5"><StickyNote className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" /> Ghi chú: {add.notes}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Create Addendum */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900">Thêm Phụ lục Hợp đồng Mới</h3>
              <form onSubmit={handleCreateAddendum} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên Phụ lục</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Phụ lục 03: Mở rộng Băng thông"
                    className="w-full border border-slate-200 rounded-lg p-2.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Số Phụ lục</label>
                    <input
                      required
                      value={addendumNumber}
                      onChange={(e) => setAddendumNumber(e.target.value)}
                      placeholder="PL-03/CLOUD01"
                      className="w-full border border-slate-200 rounded-lg p-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Chênh lệch Giá trị (VNĐ)</label>
                    <input
                      type="number"
                      value={valueAdjustment}
                      onChange={(e) => setValueAdjustment(e.target.value)}
                      placeholder="100000000"
                      className="w-full border border-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày Hạn Mới (nếu gia hạn)</label>
                  <input
                    type="date"
                    value={dateAdjustment}
                    onChange={(e) => setDateAdjustment(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg text-slate-600 font-bold">Hủy</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Tạo Phụ lục</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Version Compare Diff */}
        {showCompareModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileDiff className="w-5 h-5 text-purple-600" /> So sánh Phiên bản Track Changes
                </h3>
                <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xs">Đóng</button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Phiên bản 1: Hợp đồng Gốc</span>
                  <span>Phiên bản 2: Phụ lục 02</span>
                </div>
                <div className="p-3 bg-white border rounded-lg font-mono leading-relaxed">
                  Nội dung điều chỉnh: <span className="bg-red-100 text-red-700 line-through">1.200.000.000 VNĐ (31/12/2026)</span> <ArrowRight className="w-3 h-3 inline" aria-hidden="true" /> <span className="bg-green-100 text-green-700 font-bold">1.550.000.000 VNĐ (30/06/2027)</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
