import React, { useState, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, X, BookOpen, Settings, ChevronLeft, ChevronRight, Check, AlertCircle, GitBranch, LogOut, Layers } from 'lucide-react';
import { courseApi } from './api.js'; // ← 경로 맞게 수정

const ITEMS_PER_PAGE = 10;

const categoryStyles = {
    '공통': { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
    'SW전공': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    '컴공전공': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
};

const gradeStyles = {
    1: { bg: 'bg-rose-50', text: 'text-rose-700' },
    2: { bg: 'bg-amber-50', text: 'text-amber-700' },
    3: { bg: 'bg-teal-50', text: 'text-teal-700' },
    4: { bg: 'bg-violet-50', text: 'text-violet-700' },
};

// ===== 과목 추가/수정 모달 =====
function CourseModal({ open, onClose, onSave, editing, existingCodes }) {
    const [form, setForm] = useState({ code: '', title: '', credits: 3, category: '공통', grade: 1, semester: 1 });
    const [errors, setErrors] = useState({});

    React.useEffect(() => {
        if (editing) setForm(editing);
        else setForm({ code: '', title: '', credits: 3, category: '공통', grade: 1, semester: 1 });
        setErrors({});
    }, [editing, open]);

    if (!open) return null;

    const handleSubmit = () => {
        const e = {};
        if (!form.title.trim()) e.title = '과목명을 입력해주세요';
        if (!form.code.trim()) e.code = '과목 코드를 입력해주세요';
        else if (!editing && existingCodes.includes(form.code.trim())) e.code = '이미 존재하는 과목 코드입니다';
        if (form.credits < 0) e.credits = '학점은 0 이상이어야 합니다';
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ animation: 'modalIn 0.2s ease-out' }}>
                <style>{`@keyframes modalIn { from { opacity:0; transform: translateY(-8px) scale(0.98);} to { opacity:1; transform: translateY(0) scale(1);} }`}</style>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{editing ? '과목 수정' : '과목 추가'}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{editing ? '과목 정보를 수정합니다' : '새 과목의 기본 정보를 입력합니다'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">과목명 <span className="text-rose-500">*</span></label>
                        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 프로그래밍 기초"
                               className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.title ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'}`} />
                        {errors.title && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.title}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">과목 코드 <span className="text-rose-500">*</span></label>
                            <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CS156" disabled={!!editing}
                                   className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all font-mono disabled:bg-slate-50 disabled:text-slate-500 ${errors.code ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'}`} />
                            {errors.code && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.code}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">학점 <span className="text-rose-500">*</span></label>
                            <input type="number" min="0" max="20" value={form.credits} onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) || 0 })}
                                   className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all tabular-nums" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">구분 <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-3 gap-2">
                            {['공통', 'SW전공', '컴공전공'].map((cat) => (
                                <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                                        className={`px-3 py-2 text-sm rounded-lg border transition-all flex items-center justify-center gap-1.5 ${form.category === cat ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${categoryStyles[cat].dot}`}></span>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">학년 <span className="text-rose-500">*</span></label>
                            <div className="grid grid-cols-4 gap-1">
                                {[1, 2, 3, 4].map((g) => (
                                    <button key={g} type="button" onClick={() => setForm({ ...form, grade: g })}
                                            className={`py-2 text-sm rounded-lg border transition-all tabular-nums ${form.grade === g ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">학기 <span className="text-rose-500">*</span></label>
                            <div className="grid grid-cols-2 gap-1">
                                {[1, 2].map((s) => (
                                    <button key={s} type="button" onClick={() => setForm({ ...form, semester: s })}
                                            className={`py-2 text-sm rounded-lg border transition-all tabular-nums ${form.semester === s ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                        {s}학기
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">취소</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
                        {editing ? <><Check size={14} />수정 완료</> : <><Plus size={14} />추가하기</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ConfirmDeleteModal({ open, onClose, onConfirm, courseName }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4 mx-auto">
                    <Trash2 size={20} className="text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 text-center mb-1">과목을 삭제할까요?</h3>
                <p className="text-sm text-slate-500 text-center mb-5">
                    <span className="font-medium text-slate-700">{courseName}</span> 과목이 삭제됩니다.<br />
                    이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">취소</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors">삭제</button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, sublabel, accent }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${accent}`}></span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tabular-nums">{value}</span>
                <span className="text-xs text-slate-400">{sublabel}</span>
            </div>
        </div>
    );
}

// ============================================================
// AdminDashboard 메인 컴포넌트
// ============================================================
export default function AdminDashboard({ onSwitchToMain, onLogout }) {
    // ===== State =====
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterGrade, setFilterGrade] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [toast, setToast] = useState(null);

    // ===== 토스트 =====
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2500);
    };

    // ===== 백엔드에서 과목 목록 로드 =====
    React.useEffect(() => {
        const loadCourses = async () => {
            try {
                setLoading(true);
                const data = await courseApi.getAll();
                setCourses(data);
            } catch (err) {
                console.error('과목 로드 실패:', err);
                showToast('과목 데이터를 불러오지 못했습니다', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadCourses();
    }, []);

    // ===== 필터링 =====
    const filteredCourses = useMemo(() => {
        return courses.filter((c) => {
            const matchSearch = search === '' || c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
            const matchGrade = filterGrade === 'all' || c.grade === parseInt(filterGrade);
            const matchCategory = filterCategory === 'all' || c.category === filterCategory;
            return matchSearch && matchGrade && matchCategory;
        });
    }, [courses, search, filterGrade, filterCategory]);

    const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    React.useEffect(() => { setPage(1); }, [search, filterGrade, filterCategory]);

    // ===== 추가 / 수정 저장 (API 연결) =====
    const handleSave = async (formData) => {
        try {
            if (editingCourse) {
                // 수정
                const updated = await courseApi.update(editingCourse.id, formData);
                setCourses(courses.map(c => c.id === editingCourse.id ? updated : c));
                showToast('과목 정보가 수정되었습니다');
            } else {
                // 추가
                const created = await courseApi.create(formData);
                setCourses([...courses, created]);
                showToast('새 과목이 추가되었습니다');
            }
            setModalOpen(false);
            setEditingCourse(null);
        } catch (err) {
            console.error('저장 실패:', err);
            showToast('저장에 실패했습니다', 'error');
        }
    };

    // ===== 삭제 (API 연결) =====
    const handleDelete = async () => {
        try {
            await courseApi.delete(deleteTarget.id);
            setCourses(courses.filter(c => c.id !== deleteTarget.id));
            showToast('과목이 삭제되었습니다', 'delete');
        } catch (err) {
            console.error('삭제 실패:', err);
            showToast('삭제에 실패했습니다', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    // ===== 통계 =====
    const stats = useMemo(() => ({
        total: courses.length,
        common: courses.filter(c => c.category === '공통').length,
        sw: courses.filter(c => c.category === 'SW전공').length,
        cs: courses.filter(c => c.category === '컴공전공').length,
    }), [courses]);

    const resetFilters = () => {
        setSearch('');
        setFilterGrade('all');
        setFilterCategory('all');
    };

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}>
            <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />

            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/90">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
                            <GitBranch size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 leading-tight">Tree Navigator</h1>
                            <p className="text-xs text-slate-500 leading-tight">코스 관리 시스템</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-md border border-indigo-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        <span className="text-xs font-medium text-indigo-700">관리자 계정</span>
                    </div>
                </div>
            </header>

            <div className="px-4 py-4">
                <div className="flex gap-3" style={{ height: 'calc(100vh - 96px)' }}>

                    {/* 좌측 패널 */}
                    <aside className="w-56 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden flex-shrink-0">
                        <div className="p-4 border-b border-slate-100">
                            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Search size={12} />검색
                            </h2>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="과목명 또는 코드..."
                                       className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
                            </div>
                        </div>

                        <div className="p-4 border-b border-slate-100 flex-1 overflow-y-auto">
                            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Layers size={12} />학년 필터
                            </h2>
                            <div className="space-y-1 mb-5">
                                {['all', '1', '2', '3', '4'].map((g) => (
                                    <label key={g} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input type="radio" checked={filterGrade === g} onChange={() => setFilterGrade(g)} className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-400 cursor-pointer" />
                                        <span className="text-sm text-slate-700">{g === 'all' ? '전체' : `${g}학년`}</span>
                                        <span className="ml-auto text-[10px] text-slate-400 tabular-nums">
                                            {g === 'all' ? courses.length : courses.filter(c => c.grade === parseInt(g)).length}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <BookOpen size={12} />트랙 필터
                            </h2>
                            <div className="space-y-1">
                                {['all', '공통', 'SW전공', '컴공전공'].map((cat) => (
                                    <label key={cat} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input type="radio" checked={filterCategory === cat} onChange={() => setFilterCategory(cat)} className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-400 cursor-pointer" />
                                        {cat !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${categoryStyles[cat].dot}`}></span>}
                                        <span className="text-sm text-slate-700">{cat === 'all' ? '전체' : cat}</span>
                                        <span className="ml-auto text-[10px] text-slate-400 tabular-nums">
                                            {cat === 'all' ? courses.length : courses.filter(c => c.category === cat).length}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 border-t border-slate-100 space-y-2">
                            <button onClick={resetFilters} className="w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                                필터 초기화
                            </button>

                            <div className="pt-2 mt-1 border-t border-slate-100"></div>

                            <button onClick={onSwitchToMain} className="w-full px-3 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-md transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                <GitBranch size={13} />메인페이지 보기
                            </button>

                            <button onClick={onLogout} className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center justify-center gap-1.5">
                                <LogOut size={12} />로그아웃
                            </button>
                        </div>
                    </aside>

                    {/* 본문 */}
                    <main className="flex-1 overflow-y-auto min-w-0">
                        <div className="mb-5">
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">과목 관리</h2>
                            <p className="text-sm text-slate-500">전체 과목을 추가, 수정, 삭제할 수 있습니다</p>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-5">
                            <StatCard label="전체 과목" value={stats.total} sublabel="개" accent="bg-indigo-500" />
                            <StatCard label="공통" value={stats.common} sublabel="개" accent="bg-slate-500" />
                            <StatCard label="SW전공" value={stats.sw} sublabel="개" accent="bg-emerald-500" />
                            <StatCard label="컴공전공" value={stats.cs} sublabel="개" accent="bg-indigo-500" />
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <p className="text-xs text-slate-600">
                                    총 <span className="font-semibold text-slate-900 tabular-nums">{filteredCourses.length}</span>개의 과목
                                    {(search || filterGrade !== 'all' || filterCategory !== 'all') && (
                                        <button onClick={resetFilters} className="ml-3 text-indigo-600 hover:text-indigo-700 font-medium">필터 초기화</button>
                                    )}
                                </p>
                                <button
                                    onClick={() => { setEditingCourse(null); setModalOpen(true); }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                    <Plus size={15} />과목 추가
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[110px]">과목 코드</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">과목명</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[80px]">학점</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[120px]">구분</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[90px]">학년</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[90px]">학기</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-[100px]">액션</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {/* 로딩 중 */}
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                                    <p className="text-sm text-slate-500">데이터를 불러오는 중...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedCourses.length === 0 ? (
                                        /* 검색 결과 없음 */
                                        <tr>
                                            <td colSpan="7" className="px-4 py-16 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <Search size={20} className="text-slate-400" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700">검색 결과가 없습니다</p>
                                                    <p className="text-xs text-slate-500">다른 검색어나 필터를 시도해보세요</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        /* 과목 목록 */
                                        paginatedCourses.map((course) => {
                                            const catStyle = categoryStyles[course.category];
                                            const gradeStyle = gradeStyles[course.grade];
                                            return (
                                                <tr key={course.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-4 py-3.5"><span className="text-xs font-mono font-medium text-slate-500">{course.code}</span></td>
                                                    <td className="px-4 py-3.5"><span className="text-sm font-medium text-slate-900">{course.title}</span></td>
                                                    <td className="px-4 py-3.5 text-center"><span className="text-sm font-semibold text-slate-700 tabular-nums">{course.credits}</span></td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md ${catStyle.bg} ${catStyle.text}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`}></span>
                                                            {course.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md tabular-nums ${gradeStyle.bg} ${gradeStyle.text}`}>{course.grade}학년</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center"><span className="text-xs text-slate-600 tabular-nums">{course.semester}학기</span></td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingCourse(course); setModalOpen(true); }}
                                                                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                                                title="수정"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteTarget(course)}
                                                                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                                title="삭제"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            {/* 페이지네이션 */}
                            {!loading && totalPages > 1 && (
                                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                    <p className="text-xs text-slate-500">
                                        <span className="tabular-nums">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>{' - '}
                                        <span className="tabular-nums">{Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)}</span>{' / '}
                                        <span className="tabular-nums">{filteredCourses.length}</span>
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                                                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:bg-white hover:border-slate-300 border border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronLeft size={15} />
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 7) pageNum = i + 1;
                                            else if (currentPage <= 4) pageNum = i + 1;
                                            else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                                            else pageNum = currentPage - 3 + i;
                                            return (
                                                <button key={pageNum} onClick={() => setPage(pageNum)}
                                                        className={`w-8 h-8 rounded-md text-xs font-medium tabular-nums transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:border-slate-300 border border-transparent'}`}>
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                                                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:bg-white hover:border-slate-300 border border-transparent disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* 모달 */}
            <CourseModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingCourse(null); }}
                onSave={handleSave}
                editing={editingCourse}
                existingCodes={courses.map(c => c.code)}
            />
            <ConfirmDeleteModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                courseName={deleteTarget?.title}
            />

            {/* 토스트 */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-sm" style={{ animation: 'toastIn 0.3s ease-out' }}>
                    <style>{`@keyframes toastIn { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform: translateY(0);} }`}</style>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        toast.type === 'delete' ? 'bg-rose-500' :
                            toast.type === 'error'  ? 'bg-rose-500' :
                                'bg-emerald-500'
                    }`}>
                        {toast.type === 'delete' || toast.type === 'error'
                            ? <X size={11} />
                            : <Check size={12} />
                        }
                    </div>
                    {toast.message}
                </div>
            )}
        </div>
    );
}