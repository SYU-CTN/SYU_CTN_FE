import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    Search, Plus, Pencil, Trash2, X, BookOpen,
    ChevronLeft, ChevronRight, Check, AlertCircle,
    GitBranch, LogOut, Layers, Link, Unlink, Info
} from 'lucide-react';
import { courseApi, prerequisiteApi } from './api.js';

const ITEMS_PER_PAGE = 10;

const categoryStyles = {
    '공통':    { bg: 'bg-slate-100',  text: 'text-slate-700',  dot: 'bg-slate-500',  cardBorder: '#cbd5e1', cardBg: '#f8fafc' },
    'SW전공':  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', cardBorder: '#86efac', cardBg: '#ecfdf5' },
    '컴공전공': { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500',  cardBorder: '#a5b4fc', cardBg: '#eef2ff' },
};

const gradeStyles = {
    1: { bg: 'bg-rose-50',   text: 'text-rose-700'   },
    2: { bg: 'bg-amber-50',  text: 'text-amber-700'  },
    3: { bg: 'bg-teal-50',   text: 'text-teal-700'   },
    4: { bg: 'bg-violet-50', text: 'text-violet-700' },
};

const gradeColor = {
    1: '#f5f5f7', 2: '#e8f5e9', 3: '#fff8e1', 4: '#f5f5f7',
};

// ============================================================
// 선수과목 미니 선택 캔버스 (CourseModal 내부용)
// ============================================================
const MODAL_CARD_W = 110;
const MODAL_CARD_H = 42;
const MODAL_COL_W  = 170;
const MODAL_PAD    = 14;

function buildModalLayout(courses) {
    const byGrade = { 1: [], 2: [], 3: [], 4: [] };
    courses.forEach(c => { if (byGrade[c.grade]) byGrade[c.grade].push(c); });
    Object.values(byGrade).forEach(arr => arr.sort((a, b) => a.semester - b.semester || a.id - b.id));

    const positions = {};
    Object.entries(byGrade).forEach(([grade, list]) => {
        const gi = parseInt(grade) - 1;
        const x = MODAL_PAD + gi * (MODAL_COL_W + 12);
        list.forEach((c, idx) => {
            positions[c.id] = {
                x,
                y: MODAL_PAD + 28 + idx * (MODAL_CARD_H + 10),
                w: MODAL_CARD_W,
                h: MODAL_CARD_H,
            };
        });
    });

    const maxCount = Math.max(...Object.values(byGrade).map(l => l.length), 1);
    const canvasW = MODAL_PAD * 2 + 4 * MODAL_COL_W + 3 * 12;
    const canvasH = MODAL_PAD + 28 + maxCount * (MODAL_CARD_H + 10) + MODAL_PAD;
    return { positions, canvasW, canvasH };
}

function PrerequisiteSelector({ courses, selectedPrereqs, currentCourseId, onChange }) {
    // selectedPrereqs: array of course IDs that are prerequisites for the current course
    const svgRef = useRef(null);
    const [hoverDot, setHoverDot] = useState(null);

    const availableCourses = useMemo(
        () => courses.filter(c => c.id !== currentCourseId),
        [courses, currentCourseId]
    );

    const { positions, canvasW, canvasH } = useMemo(
        () => buildModalLayout(availableCourses),
        [availableCourses]
    );

    const togglePrereq = useCallback((courseId) => {
        if (selectedPrereqs.includes(courseId)) {
            onChange(selectedPrereqs.filter(id => id !== courseId));
        } else {
            onChange([...selectedPrereqs, courseId]);
        }
    }, [selectedPrereqs, onChange]);

    return (
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 260, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <svg
                ref={svgRef}
                width={canvasW}
                height={canvasH}
                style={{ display: 'block', userSelect: 'none' }}
            >
                {/* 학년 칼럼 배경 */}
                {[1, 2, 3, 4].map((g, i) => (
                    <g key={g}>
                        <rect
                            x={MODAL_PAD + i * (MODAL_COL_W + 12)} y={MODAL_PAD}
                            width={MODAL_COL_W} height={canvasH - MODAL_PAD * 2}
                            rx={5} fill={gradeColor[g]} stroke="#e2e8f0" strokeWidth={1}
                        />
                        <text
                            x={MODAL_PAD + i * (MODAL_COL_W + 12) + MODAL_COL_W / 2}
                            y={MODAL_PAD + 18}
                            textAnchor="middle" fontSize={10} fontWeight={700} fill="#94a3b8"
                        >{g}학년</text>
                    </g>
                ))}

                {/* 과목 카드 */}
                {availableCourses.map(course => {
                    const pos = positions[course.id];
                    if (!pos) return null;
                    const isSelected = selectedPrereqs.includes(course.id);
                    const cat = categoryStyles[course.category] || categoryStyles['공통'];
                    const isHover = hoverDot === course.id;

                    return (
                        <g
                            key={course.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => togglePrereq(course.id)}
                            onMouseEnter={() => setHoverDot(course.id)}
                            onMouseLeave={() => setHoverDot(null)}
                        >
                            <rect
                                x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={5}
                                fill={isSelected ? '#eef2ff' : isHover ? '#f8fafc' : 'white'}
                                stroke={isSelected ? '#4f46e5' : isHover ? '#a5b4fc' : cat.cardBorder}
                                strokeWidth={isSelected ? 2 : 1.5}
                            />
                            {/* 선택 체크 표시 */}
                            {isSelected && (
                                <g>
                                    <circle cx={pos.x + pos.w - 7} cy={pos.y + 7} r={6} fill="#4f46e5" />
                                    <polyline
                                        points={`${pos.x + pos.w - 10},${pos.y + 7} ${pos.x + pos.w - 7},${pos.y + 10} ${pos.x + pos.w - 4},${pos.y + 4}`}
                                        fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                                    />
                                </g>
                            )}
                            {/* 카드 텍스트 */}
                            <text x={pos.x + 6} y={pos.y + 14} fontSize={8} fill="#94a3b8" fontFamily="monospace">{course.code}</text>
                            <foreignObject x={pos.x + 4} y={pos.y + 18} width={pos.w - 12} height={pos.h - 20}>
                                <div
                                    xmlns="http://www.w3.org/1999/xhtml"
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 600,
                                        lineHeight: 1.3,
                                        color: isSelected ? '#3730a3' : '#1e293b',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}
                                >
                                    {course.title}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// ============================================================
// 과목 추가/수정 모달 (선수관계 드래그 선택 기능 추가)
// ============================================================
function CourseModal({ open, onClose, onSave, editing, existingCodes, allCourses }) {
    const [form, setForm] = useState({ code: '', title: '', credits: 3, category: '공통', grade: 1, semester: 1 });
    const [selectedPrereqs, setSelectedPrereqs] = useState([]); // IDs
    const [errors, setErrors] = useState({});
    const [showPrereqSelector, setShowPrereqSelector] = useState(false);

    useEffect(() => {
        if (editing) {
            setForm(editing);
            setSelectedPrereqs(editing.prerequisites || []);
        } else {
            setForm({ code: '', title: '', credits: 3, category: '공통', grade: 1, semester: 1 });
            setSelectedPrereqs([]);
        }
        setErrors({});
        setShowPrereqSelector(false);
    }, [editing, open]);

    if (!open) return null;

    const handleSubmit = () => {
        const e = {};
        if (!form.title.trim()) e.title = '과목명을 입력해주세요';
        if (!form.code.trim()) e.code = '과목 코드를 입력해주세요';
        else if (!editing && existingCodes.includes(form.code.trim())) e.code = '이미 존재하는 과목 코드입니다';
        if (form.credits < 0) e.credits = '학점은 0 이상이어야 합니다';
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        onSave({ ...form, prerequisites: selectedPrereqs });
    };

    // 선택된 선수과목 이름 목록
    const selectedNames = selectedPrereqs
        .map(id => allCourses.find(c => c.id === id)?.title)
        .filter(Boolean);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden"
                style={{ maxWidth: showPrereqSelector ? 760 : 520, animation: 'modalIn 0.2s ease-out', transition: 'max-width 0.25s ease' }}
                onClick={e => e.stopPropagation()}
            >
                <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(-8px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>

                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{editing ? '과목 수정' : '과목 추가'}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{editing ? '과목 정보를 수정합니다' : '새 과목의 기본 정보를 입력합니다'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
                </div>

                <div className="flex">
                    {/* 왼쪽: 기본 정보 */}
                    <div className="flex-1 px-6 py-5 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">과목명 <span className="text-rose-500">*</span></label>
                            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="예: 프로그래밍 기초"
                                   className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.title ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'}`} />
                            {errors.title && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.title}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">과목 코드 <span className="text-rose-500">*</span></label>
                                <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CS156" disabled={!!editing}
                                       className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all font-mono disabled:bg-slate-50 ${errors.code ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'}`} />
                                {errors.code && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.code}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">학점 <span className="text-rose-500">*</span></label>
                                <input type="number" min="0" max="20" value={form.credits} onChange={e => setForm({ ...form, credits: parseInt(e.target.value) || 0 })}
                                       className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all tabular-nums" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">구분 <span className="text-rose-500">*</span></label>
                            <div className="grid grid-cols-3 gap-2">
                                {['공통', 'SW전공', '컴공전공'].map(cat => (
                                    <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                                            className={`px-3 py-2 text-sm rounded-lg border transition-all flex items-center justify-center gap-1.5 ${form.category === cat ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${categoryStyles[cat].dot}`}></span>{cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">학년 <span className="text-rose-500">*</span></label>
                                <div className="grid grid-cols-4 gap-1">
                                    {[1,2,3,4].map(g => (
                                        <button key={g} type="button" onClick={() => setForm({ ...form, grade: g })}
                                                className={`py-2 text-sm rounded-lg border transition-all ${form.grade === g ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>{g}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">학기 <span className="text-rose-500">*</span></label>
                                <div className="grid grid-cols-2 gap-1">
                                    {[1,2].map(s => (
                                        <button key={s} type="button" onClick={() => setForm({ ...form, semester: s })}
                                                className={`py-2 text-sm rounded-lg border transition-all ${form.semester === s ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>{s}학기</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 선수과목 요약 버튼 */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">선수과목</label>
                            <button
                                type="button"
                                onClick={() => setShowPrereqSelector(v => !v)}
                                className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition-all flex items-center justify-between gap-2 ${showPrereqSelector ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <Link size={13} />
                                    {selectedPrereqs.length === 0
                                        ? '선수과목 없음 (클릭하여 선택)'
                                        : `${selectedPrereqs.length}개 선택됨`
                                    }
                                </span>
                                <ChevronRight size={14} style={{ transform: showPrereqSelector ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                            {selectedPrereqs.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {selectedNames.map((name, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                                            {name}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPrereqs(selectedPrereqs.filter(id => id !== selectedPrereqs[i]))}
                                                className="text-indigo-400 hover:text-indigo-700"
                                            ><X size={10} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 선수과목 선택 캔버스 (토글) */}
                    {showPrereqSelector && (
                        <div className="border-l border-slate-100 flex flex-col" style={{ width: 220 }}>
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                                <p className="text-xs font-semibold text-slate-700">선수과목 선택</p>
                                <p className="text-xs text-slate-500 mt-0.5">카드를 클릭해 선택/해제</p>
                            </div>
                            <div className="flex-1 p-3 overflow-auto">
                                <PrerequisiteSelector
                                    courses={allCourses}
                                    selectedPrereqs={selectedPrereqs}
                                    currentCourseId={editing?.id ?? null}
                                    onChange={setSelectedPrereqs}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
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
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 p-6" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4 mx-auto"><Trash2 size={20} className="text-rose-600" /></div>
                <h3 className="text-lg font-semibold text-slate-900 text-center mb-1">과목을 삭제할까요?</h3>
                <p className="text-sm text-slate-500 text-center mb-5">
                    <span className="font-medium text-slate-700">{courseName}</span> 과목이 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.
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
// 선수관계 캔버스 - 드래그로 연결 (선수관계 탭 전용)
// ============================================================
const MINI_CARD_W = 130;
const MINI_CARD_H = 48;
const MINI_COL_W  = 200;
const MINI_PAD    = 20;

function buildMiniLayout(courses) {
    const byGrade = { 1: [], 2: [], 3: [], 4: [] };
    courses.forEach(c => { if (byGrade[c.grade]) byGrade[c.grade].push(c); });
    Object.values(byGrade).forEach(arr => arr.sort((a, b) => a.semester - b.semester || a.id - b.id));

    const positions = {};
    Object.entries(byGrade).forEach(([grade, list]) => {
        const gi = parseInt(grade) - 1;
        const x = MINI_PAD + gi * (MINI_COL_W + 16);
        list.forEach((c, idx) => {
            positions[c.id] = {
                x,
                y: MINI_PAD + 36 + idx * (MINI_CARD_H + 12),
                w: MINI_CARD_W,
                h: MINI_CARD_H,
            };
        });
    });

    const maxCount = Math.max(...Object.values(byGrade).map(l => l.length), 1);
    const canvasW = MINI_PAD * 2 + 4 * MINI_COL_W + 3 * 16;
    const canvasH = MINI_PAD + 36 + maxCount * (MINI_CARD_H + 12) + MINI_PAD;
    return { positions, canvasW, canvasH };
}

function PrerequisiteCanvas({ courses, prerequisites, onAdd, onDelete, saving }) {
    const svgRef        = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [hoverId, setHoverId]   = useState(null);
    const [hoverEdge, setHoverEdge] = useState(null);

    const { positions, canvasW, canvasH } = useMemo(() => buildMiniLayout(courses), [courses]);

    const getSVGPoint = useCallback((e) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const rect = svg.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    const getCardAt = useCallback((x, y) => {
        for (const [idStr, pos] of Object.entries(positions)) {
            if (x >= pos.x && x <= pos.x + pos.w && y >= pos.y && y <= pos.y + pos.h) {
                return parseInt(idStr);
            }
        }
        return null;
    }, [positions]);

    const handleMouseDown = useCallback((e, courseId) => {
        e.preventDefault();
        const pt = getSVGPoint(e);
        setDragging({ courseId, startX: pt.x, startY: pt.y, curX: pt.x, curY: pt.y });
    }, [getSVGPoint]);

    const handleMouseMove = useCallback((e) => {
        if (!dragging) return;
        const pt   = getSVGPoint(e);
        const over = getCardAt(pt.x, pt.y);
        setDragging(prev => prev ? { ...prev, curX: pt.x, curY: pt.y } : null);
        setHoverId(over && over !== dragging.courseId ? over : null);
    }, [dragging, getSVGPoint, getCardAt]);

    const handleMouseUp = useCallback((e) => {
        if (!dragging) return;
        const pt     = getSVGPoint(e);
        const target = getCardAt(pt.x, pt.y);
        if (target && target !== dragging.courseId) {
            onAdd(dragging.courseId, target);
        }
        setDragging(null);
        setHoverId(null);
    }, [dragging, getSVGPoint, getCardAt, onAdd]);

    return (
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '100%' }}>
            <svg
                ref={svgRef}
                width={canvasW} height={canvasH}
                style={{ display: 'block', cursor: dragging ? 'crosshair' : 'default', userSelect: 'none' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { setDragging(null); setHoverId(null); }}
            >
                {/* 학년 칼럼 배경 */}
                {[1,2,3,4].map((g, i) => (
                    <g key={g}>
                        <rect
                            x={MINI_PAD + i * (MINI_COL_W + 16)} y={MINI_PAD}
                            width={MINI_COL_W} height={canvasH - MINI_PAD * 2}
                            rx={6} fill={gradeColor[g]} stroke="#e2e8f0" strokeWidth={1}
                        />
                        <text
                            x={MINI_PAD + i * (MINI_COL_W + 16) + MINI_COL_W / 2}
                            y={MINI_PAD + 22}
                            textAnchor="middle" fontSize={12} fontWeight={700} fill="#64748b"
                        >{g}학년</text>
                    </g>
                ))}

                {/* 선수관계 선 */}
                {prerequisites.map(([preId, postId], idx) => {
                    const fp = positions[preId], tp = positions[postId];
                    if (!fp || !tp) return null;
                    const x1 = fp.x + fp.w, y1 = fp.y + fp.h / 2;
                    const x2 = tp.x,        y2 = tp.y + tp.h / 2;
                    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                    const isHovered = hoverEdge === idx;
                    return (
                        <g key={idx} onMouseEnter={() => setHoverEdge(idx)} onMouseLeave={() => setHoverEdge(null)}>
                            <path d={`M${x1},${y1} C${x1+40},${y1} ${x2-40},${y2} ${x2},${y2}`}
                                  fill="none" stroke="transparent" strokeWidth={12}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => !saving && onDelete(preId, postId)}
                            />
                            <path d={`M${x1},${y1} C${x1+40},${y1} ${x2-40},${y2} ${x2},${y2}`}
                                  fill="none"
                                  stroke={isHovered ? '#ef4444' : '#6366f1'}
                                  strokeWidth={isHovered ? 2 : 1.5}
                                  markerEnd={isHovered ? 'url(#arrow-red)' : 'url(#arrow-indigo)'}
                                  style={{ transition: 'stroke 0.15s, stroke-width 0.15s', pointerEvents: 'none' }}
                            />
                            {isHovered && (
                                <g style={{ cursor: 'pointer' }} onClick={() => !saving && onDelete(preId, postId)}>
                                    <circle cx={mx} cy={my} r={9} fill="white" stroke="#ef4444" strokeWidth={1.5} />
                                    <line x1={mx-4} y1={my-4} x2={mx+4} y2={my+4} stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" />
                                    <line x1={mx+4} y1={my-4} x2={mx-4} y2={my+4} stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" />
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* 드래그 중 임시 선 */}
                {dragging && (() => {
                    const fp = positions[dragging.courseId];
                    if (!fp) return null;
                    const x1 = fp.x + fp.w, y1 = fp.y + fp.h / 2;
                    return (
                        <path d={`M${x1},${y1} C${x1+40},${y1} ${dragging.curX-40},${dragging.curY} ${dragging.curX},${dragging.curY}`}
                              fill="none" stroke="#6366f1" strokeWidth={2} strokeDasharray="6 3"
                              markerEnd="url(#arrow-indigo)" pointerEvents="none"
                        />
                    );
                })()}

                {/* 과목 카드 */}
                {courses.map(course => {
                    const pos = positions[course.id];
                    if (!pos) return null;
                    const cat     = categoryStyles[course.category] || categoryStyles['공통'];
                    const isHover = hoverId === course.id;
                    const isDrag  = dragging?.courseId === course.id;
                    const isConnectedAsPre  = prerequisites.some(([pre]) => pre === course.id);
                    const isConnectedAsPost = prerequisites.some(([, post]) => post === course.id);

                    return (
                        <g key={course.id}
                           style={{ cursor: isDrag ? 'grabbing' : 'grab' }}
                           onMouseDown={e => handleMouseDown(e, course.id)}
                        >
                            <rect
                                x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={5}
                                fill={isHover ? '#eef2ff' : 'white'}
                                stroke={isDrag ? '#4f46e5' : isHover ? '#818cf8' : cat.cardBorder}
                                strokeWidth={isDrag || isHover ? 2 : 1.5}
                                filter={isDrag ? 'drop-shadow(0 4px 8px rgba(79,70,229,0.3))' : undefined}
                            />
                            {isConnectedAsPre && (
                                <circle cx={pos.x + pos.w - 6} cy={pos.y + 6} r={3.5} fill="#6366f1" />
                            )}
                            {isConnectedAsPost && (
                                <circle cx={pos.x + 6} cy={pos.y + 6} r={3.5} fill="#f59e0b" />
                            )}
                            {/* ✅ display 중복 제거: foreignObject 내부 div 스타일 정리 */}
                            <foreignObject x={pos.x + 4} y={pos.y + 3} width={pos.w - 8} height={pos.h - 6}>
                                <div
                                    xmlns="http://www.w3.org/1999/xhtml"
                                    style={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 1, fontFamily: 'monospace' }}>
                                        {course.code}
                                    </div>
                                    <div style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        lineHeight: 1.2,
                                        color: '#1e293b',
                                        wordBreak: 'keep-all',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}>
                                        {course.title}
                                    </div>
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}

                <defs>
                    <marker id="arrow-indigo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                    </marker>
                    <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                    </marker>
                </defs>
            </svg>
        </div>
    );
}

// ============================================================
// AdminDashboard 메인 컴포넌트
// ============================================================
export default function AdminDashboard({ onSwitchToMain, onLogout }) {
    const [activeTab, setActiveTab] = useState('courses');

    const [courses,       setCourses]       = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [search,        setSearch]        = useState('');
    const [filterGrade,   setFilterGrade]   = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [page,          setPage]          = useState(1);
    const [modalOpen,     setModalOpen]     = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [deleteTarget,  setDeleteTarget]  = useState(null);

    const [prerequisites, setPrerequisites] = useState([]);
    const [preLoading,    setPreLoading]    = useState(false);
    const [preSaving,     setPreSaving]     = useState(false);
    const [preSearch,     setPreSearch]     = useState('');

    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2500);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await courseApi.getAll();
                setCourses(data);
            } catch (err) {
                console.error(err);
                showToast('과목 데이터를 불러오지 못했습니다', 'error');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (activeTab !== 'prerequisites') return;
        (async () => {
            try {
                setPreLoading(true);
                const data = await prerequisiteApi.getAll();
                setPrerequisites(data);
            } catch (err) {
                console.error(err);
                showToast('선수관계 데이터를 불러오지 못했습니다', 'error');
            } finally {
                setPreLoading(false);
            }
        })();
    }, [activeTab]);

    const filteredCourses = useMemo(() => courses.filter(c => {
        const ms = search === '' || c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
        const mg = filterGrade === 'all' || c.grade === parseInt(filterGrade);
        const mc = filterCategory === 'all' || c.category === filterCategory;
        return ms && mg && mc;
    }), [courses, search, filterGrade, filterCategory]);

    const totalPages       = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
    const currentPage      = Math.min(page, totalPages);
    const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    useEffect(() => { setPage(1); }, [search, filterGrade, filterCategory]);

    const filteredPreCourses = useMemo(() => {
        if (!preSearch.trim()) return courses;
        const q = preSearch.toLowerCase();
        return courses.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }, [courses, preSearch]);

    const prereqPairs = useMemo(() =>
            prerequisites.map(p => [p.preCourseId, p.postCourseId]),
        [prerequisites]
    );

    // ── 과목 CRUD ─────────────────────────────────────────────
    const handleSave = async (formData) => {
        // formData.prerequisites: 선택된 선수과목 ID 배열
        const { prerequisites: newPrereqs = [], ...courseData } = formData;
        try {
            if (editingCourse) {
                const updated = await courseApi.update(editingCourse.id, courseData);
                setCourses(courses.map(c => c.id === editingCourse.id ? updated : c));

                // 선수관계 동기화 (기존 것 삭제 후 새로 추가)
                const oldPrereqs = prerequisites
                    .filter(p => p.postCourseId === editingCourse.id)
                    .map(p => p.preCourseId);
                const toDelete = oldPrereqs.filter(id => !newPrereqs.includes(id));
                const toAdd    = newPrereqs.filter(id => !oldPrereqs.includes(id));
                for (const preId of toDelete) {
                    await prerequisiteApi.deleteByPair(preId, editingCourse.id);
                    setPrerequisites(prev => prev.filter(p => !(p.preCourseId === preId && p.postCourseId === editingCourse.id)));
                }
                for (const preId of toAdd) {
                    const created = await prerequisiteApi.create(preId, editingCourse.id);
                    setPrerequisites(prev => [...prev, created]);
                }
                showToast('과목 정보가 수정되었습니다');
            } else {
                const created = await courseApi.create(courseData);
                setCourses([...courses, created]);
                // 선수관계 추가
                for (const preId of newPrereqs) {
                    const rel = await prerequisiteApi.create(preId, created.id);
                    setPrerequisites(prev => [...prev, rel]);
                }
                showToast('새 과목이 추가되었습니다');
            }
            setModalOpen(false);
            setEditingCourse(null);
        } catch (err) {
            console.error(err);
            showToast(err.message || '저장에 실패했습니다', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await courseApi.delete(deleteTarget.id);
            setCourses(courses.filter(c => c.id !== deleteTarget.id));
            showToast('과목이 삭제되었습니다', 'delete');
        } catch (err) {
            console.error(err);
            showToast('삭제에 실패했습니다', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    // ── 선수관계 CRUD ─────────────────────────────────────────
    const handleAddPrereq = useCallback(async (preId, postId) => {
        const already = prerequisites.some(p => p.preCourseId === preId && p.postCourseId === postId);
        if (already) { showToast('이미 등록된 선수관계입니다', 'error'); return; }
        try {
            setPreSaving(true);
            const created = await prerequisiteApi.create(preId, postId);
            setPrerequisites(prev => [...prev, created]);
            const preName  = courses.find(c => c.id === preId)?.title  || preId;
            const postName = courses.find(c => c.id === postId)?.title || postId;
            showToast(`${preName} → ${postName} 선수관계가 추가됐습니다`);
        } catch (err) {
            console.error(err);
            showToast(err.message || '선수관계 추가에 실패했습니다', 'error');
        } finally {
            setPreSaving(false);
        }
    }, [prerequisites, courses, showToast]);

    const handleDeletePrereq = useCallback(async (preId, postId) => {
        try {
            setPreSaving(true);
            await prerequisiteApi.deleteByPair(preId, postId);
            setPrerequisites(prev => prev.filter(p => !(p.preCourseId === preId && p.postCourseId === postId)));
            showToast('선수관계가 삭제됐습니다', 'delete');
        } catch (err) {
            console.error(err);
            showToast('선수관계 삭제에 실패했습니다', 'error');
        } finally {
            setPreSaving(false);
        }
    }, [showToast]);

    const stats = useMemo(() => ({
        total:  courses.length,
        common: courses.filter(c => c.category === '공통').length,
        sw:     courses.filter(c => c.category === 'SW전공').length,
        cs:     courses.filter(c => c.category === '컴공전공').length,
    }), [courses]);

    const resetFilters = () => { setSearch(''); setFilterGrade('all'); setFilterCategory('all'); };

    return (
        <div className="min-h-screen bg-slate-50"
             style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}>
            <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />

            {/* 헤더 */}
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
                                <input type="text" value={activeTab === 'courses' ? search : preSearch}
                                       onChange={e => activeTab === 'courses' ? setSearch(e.target.value) : setPreSearch(e.target.value)}
                                       placeholder="과목명 또는 코드..."
                                       className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
                            </div>
                        </div>

                        {activeTab === 'courses' && (
                            <div className="p-4 border-b border-slate-100 flex-1 overflow-y-auto">
                                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Layers size={12} />학년 필터
                                </h2>
                                <div className="space-y-1 mb-5">
                                    {['all','1','2','3','4'].map(g => (
                                        <label key={g} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                                            <input type="radio" checked={filterGrade === g} onChange={() => setFilterGrade(g)} className="w-3.5 h-3.5 text-indigo-600 cursor-pointer" />
                                            <span className="text-sm text-slate-700">{g === 'all' ? '전체' : `${g}학년`}</span>
                                            <span className="ml-auto text-[10px] text-slate-400">
                                                {g === 'all' ? courses.length : courses.filter(c => c.grade === parseInt(g)).length}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <BookOpen size={12} />트랙 필터
                                </h2>
                                <div className="space-y-1">
                                    {['all','공통','SW전공','컴공전공'].map(cat => (
                                        <label key={cat} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                                            <input type="radio" checked={filterCategory === cat} onChange={() => setFilterCategory(cat)} className="w-3.5 h-3.5 text-indigo-600 cursor-pointer" />
                                            {cat !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${categoryStyles[cat].dot}`}></span>}
                                            <span className="text-sm text-slate-700">{cat === 'all' ? '전체' : cat}</span>
                                            <span className="ml-auto text-[10px] text-slate-400">
                                                {cat === 'all' ? courses.length : courses.filter(c => c.category === cat).length}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'prerequisites' && (
                            <div className="p-4 border-b border-slate-100 flex-1">
                                <div className="bg-indigo-50 rounded-lg p-3 space-y-2">
                                    <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                                        <Info size={12} />사용 방법
                                    </p>
                                    <p className="text-xs text-indigo-600 leading-relaxed">
                                        카드를 <strong>드래그</strong>해서 다른 카드에 <strong>드롭</strong>하면 선수관계가 연결됩니다.
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs text-indigo-600">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                        선수과목으로 연결됨
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-amber-600">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                                        후속과목으로 연결됨
                                    </div>
                                    <p className="text-xs text-indigo-600 leading-relaxed">
                                        연결선에 마우스를 올리면 <strong>삭제</strong>할 수 있습니다.
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 tabular-nums">
                                        총 {prerequisites.length}개의 선수관계
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="p-3 border-t border-slate-100 space-y-2">
                            {activeTab === 'courses' && (
                                <button onClick={resetFilters} className="w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                                    필터 초기화
                                </button>
                            )}
                            <div className="border-t border-slate-100 pt-2"></div>
                            <button onClick={onSwitchToMain}
                                    className="w-full px-3 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-md transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                <GitBranch size={13} />메인페이지 보기
                            </button>
                            <button onClick={onLogout}
                                    className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center justify-center gap-1.5">
                                <LogOut size={12} />로그아웃
                            </button>
                        </div>
                    </aside>

                    {/* 본문 */}
                    <main className="flex-1 overflow-hidden min-w-0 flex flex-col">

                        {/* 탭 */}
                        <div className="flex items-center gap-1 mb-4 bg-white border border-slate-200 rounded-xl p-1.5 self-start">
                            <button
                                onClick={() => setActiveTab('courses')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                                    activeTab === 'courses' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <BookOpen size={14} />과목 관리
                            </button>
                            <button
                                onClick={() => setActiveTab('prerequisites')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                                    activeTab === 'prerequisites' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Link size={14} />선수관계 관리
                                <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                                    activeTab === 'prerequisites' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>{prerequisites.length}</span>
                            </button>
                        </div>

                        {/* ── 과목 관리 탭 ── */}
                        {activeTab === 'courses' && (
                            <div className="flex-1 overflow-y-auto">
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
                                        <button onClick={() => { setEditingCourse(null); setModalOpen(true); }}
                                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
                                            <Plus size={15} />과목 추가
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                                {['과목 코드','과목명','학점','구분','학년','학기','액션'].map((h, i) => (
                                                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider ${i === 1 ? 'text-left' : i === 0 ? 'text-left w-[110px]' : i === 6 ? 'text-right w-[100px]' : 'text-center'} ${i === 2 ? 'w-[80px]' : i === 3 ? 'w-[120px]' : i === 4 || i === 5 ? 'w-[90px]' : ''}`}>{h}</th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {loading ? (
                                                <tr><td colSpan="7" className="px-4 py-16 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                                        <p className="text-sm text-slate-500">데이터를 불러오는 중...</p>
                                                    </div>
                                                </td></tr>
                                            ) : paginatedCourses.length === 0 ? (
                                                <tr><td colSpan="7" className="px-4 py-16 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                            <Search size={20} className="text-slate-400" />
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-700">검색 결과가 없습니다</p>
                                                    </div>
                                                </td></tr>
                                            ) : paginatedCourses.map(course => {
                                                const cs = categoryStyles[course.category];
                                                const gs = gradeStyles[course.grade];
                                                return (
                                                    <tr key={course.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-4 py-3.5"><span className="text-xs font-mono font-medium text-slate-500">{course.code}</span></td>
                                                        <td className="px-4 py-3.5"><span className="text-sm font-medium text-slate-900">{course.title}</span></td>
                                                        <td className="px-4 py-3.5 text-center"><span className="text-sm font-semibold text-slate-700 tabular-nums">{course.credits}</span></td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md ${cs.bg} ${cs.text}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`}></span>{course.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md tabular-nums ${gs.bg} ${gs.text}`}>{course.grade}학년</span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center"><span className="text-xs text-slate-600 tabular-nums">{course.semester}학기</span></td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => { setEditingCourse(course); setModalOpen(true); }}
                                                                        className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="수정">
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button onClick={() => setDeleteTarget(course)}
                                                                        className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="삭제">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {!loading && totalPages > 1 && (
                                        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                            <p className="text-xs text-slate-500">
                                                <span className="tabular-nums">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>{' - '}
                                                <span className="tabular-nums">{Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)}</span>{' / '}
                                                <span className="tabular-nums">{filteredCourses.length}</span>
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                                                        className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 border border-transparent disabled:opacity-30 hover:bg-white hover:border-slate-300 transition-all">
                                                    <ChevronLeft size={15} />
                                                </button>
                                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                                    let p;
                                                    if (totalPages <= 7) p = i + 1;
                                                    else if (currentPage <= 4) p = i + 1;
                                                    else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
                                                    else p = currentPage - 3 + i;
                                                    return (
                                                        <button key={p} onClick={() => setPage(p)}
                                                                className={`w-8 h-8 rounded-md text-xs font-medium tabular-nums transition-all ${currentPage === p ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white hover:border-slate-300 border border-transparent'}`}>{p}</button>
                                                    );
                                                })}
                                                <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                                                        className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 border border-transparent disabled:opacity-30 hover:bg-white hover:border-slate-300 transition-all">
                                                    <ChevronRight size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── 선수관계 관리 탭 ── */}
                        {activeTab === 'prerequisites' && (
                            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                                <div className="mb-4 flex items-center justify-between flex-shrink-0">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-1">선수관계 관리</h2>
                                        <p className="text-sm text-slate-500">과목 카드를 드래그해서 선수관계를 연결하세요</p>
                                    </div>
                                    {preSaving && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-md border border-indigo-100 text-indigo-700 text-xs">
                                            <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></div>
                                            저장 중...
                                        </div>
                                    )}
                                </div>

                                {preLoading ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <p className="text-sm text-slate-500">선수관계 데이터 불러오는 중...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                        <div className="flex flex-1 min-h-0">
                                            <div className="flex-1 overflow-auto p-3">
                                                <PrerequisiteCanvas
                                                    courses={preSearch.trim() ? filteredPreCourses : courses}
                                                    prerequisites={prereqPairs}
                                                    onAdd={handleAddPrereq}
                                                    onDelete={handleDeletePrereq}
                                                    saving={preSaving}
                                                />
                                            </div>

                                            <div className="w-72 border-l border-slate-100 flex flex-col flex-shrink-0">
                                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                        등록된 선수관계 ({prerequisites.length})
                                                    </h3>
                                                </div>
                                                <div className="flex-1 overflow-y-auto">
                                                    {prerequisites.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                                <Unlink size={16} className="text-slate-400" />
                                                            </div>
                                                            <p className="text-xs text-slate-500">아직 선수관계가 없습니다</p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-slate-50">
                                                            {prerequisites.map((p, idx) => {
                                                                const pre  = courses.find(c => c.id === p.preCourseId);
                                                                const post = courses.find(c => c.id === p.postCourseId);
                                                                if (!pre || !post) return null;
                                                                return (
                                                                    <div key={p.id || idx} className="px-4 py-2.5 hover:bg-slate-50 group transition-colors">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-1 mb-0.5">
                                                                                    <span className="text-[10px] font-mono text-slate-400">{pre.code}</span>
                                                                                    <span className={`text-[9px] px-1 rounded ${categoryStyles[pre.category]?.bg} ${categoryStyles[pre.category]?.text}`}>{pre.grade}학년</span>
                                                                                </div>
                                                                                <p className="text-xs font-medium text-slate-800 truncate">{pre.title}</p>
                                                                                <div className="flex items-center gap-1 my-0.5">
                                                                                    <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #818cf8', margin: '0 auto' }}></div>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 mb-0.5">
                                                                                    <span className="text-[10px] font-mono text-slate-400">{post.code}</span>
                                                                                    <span className={`text-[9px] px-1 rounded ${categoryStyles[post.category]?.bg} ${categoryStyles[post.category]?.text}`}>{post.grade}학년</span>
                                                                                </div>
                                                                                <p className="text-xs font-medium text-slate-800 truncate">{post.title}</p>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => !preSaving && handleDeletePrereq(p.preCourseId, p.postCourseId)}
                                                                                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                                                                title="삭제"
                                                                            >
                                                                                <X size={13} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                allCourses={courses}
            />
            <ConfirmDeleteModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                courseName={deleteTarget?.title}
            />

            {/* 토스트 */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-sm"
                     style={{ animation: 'toastIn 0.3s ease-out' }}>
                    <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        toast.type === 'delete' || toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                        {toast.type === 'delete' || toast.type === 'error' ? <X size={11} /> : <Check size={12} />}
                    </div>
                    {toast.message}
                </div>
            )}
        </div>
    );
}