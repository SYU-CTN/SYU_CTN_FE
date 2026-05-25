import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, BookOpen, Settings, Users, X, GitBranch, ChevronRight, Info, Layers, MessageCircle, Plus, Minus, Maximize2, LogOut } from 'lucide-react';
import { courseApi, prerequisiteApi } from '../constants/api.js';

const tracks = [
    { id: '공통', label: '공통', dot: 'bg-slate-500', text: 'text-slate-700', bg: 'bg-slate-50', cardBorder: '#cbd5e1' },
    { id: 'SW전공', label: 'SW전공', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', cardBorder: '#86efac' },
    { id: '컴공전공', label: '컴공전공', dot: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50', cardBorder: '#a5b4fc' },
];

const gradeStyle = {
    1: { bg: '#f5f5f7', headerBg: '#e8e8eb', headerText: '#475569' },
    2: { bg: '#e8f5e9', headerBg: '#c8e6c9', headerText: '#2e7d32' },
    3: { bg: '#fff8e1', headerBg: '#ffe082', headerText: '#f57f17' },
    4: { bg: '#f5f5f7', headerBg: '#e8e8eb', headerText: '#475569' },
};

const layoutOverride = {
    101: { row: 0 }, 102: { row: 2 },
    103: { row: 0 }, 104: { row: 3 }, 105: { row: 9 },
    106: { row: 0 }, 107: { row: 1 }, 108: { row: 2 }, 109: { row: 5 }, 110: { row: 6 }, 111: { row: 7 }, 112: { row: 9 },
    113: { row: 0 }, 114: { row: 1 }, 115: { row: 2 }, 116: { row: 3 }, 117: { row: 5 }, 118: { row: 7 }, 119: { row: 9 }, 120: { row: 10 },
    121: { row: 2 }, 122: { row: 3 }, 123: { row: 4 }, 124: { row: 5 }, 125: { row: 7 }, 126: { row: 8 }, 127: { row: 9 }, 128: { row: 10 }, 129: { row: 11 }, 130: { row: 12 },
    131: { row: 0 }, 132: { row: 1 }, 133: { row: 5 }, 134: { row: 6 }, 135: { row: 7 }, 136: { row: 9 }, 137: { row: 10 }, 138: { row: 11 },
    139: { row: 0 }, 140: { row: 1 }, 141: { row: 2 }, 142: { row: 5 }, 143: { row: 6 }, 144: { row: 7 }, 145: { row: 8 }, 146: { row: 9 }, 147: { row: 10 }, 148: { row: 11 },
    149: { row: 0 }, 150: { row: 1 }, 151: { row: 4 }, 152: { row: 7 }, 153: { row: 9 }, 154: { row: 10 }, 155: { row: 11 },
};

const COL_WIDTH = 320;
const SEMESTER_COL_WIDTH = 150;
const SEMESTER_GAP = 10;
const CARD_WIDTH = 150;
const CARD_HEIGHT = 72;
const ROW_HEIGHT = 86;
const HEADER_HEIGHT = 50;
const COLUMN_PADDING_TOP = 12;
const COLUMN_PADDING_BOTTOM = 16;
const PADDING_X = 24;
const PADDING_Y = 24;

function computeLayout(visibleCourses) {
    const positions = {};
    let maxRow = 0;

    visibleCourses.forEach((course) => {
        const override = layoutOverride[course.id];
        const row = override?.row ?? 0;
        if (row > maxRow) maxRow = row;

        const currentGrade = course.gradeLevel !== undefined ? course.gradeLevel : course.grade;
        const colIdx = (currentGrade || 1) - 1;
        const columnX = PADDING_X + colIdx * COL_WIDTH;

        let x, width;
        if (course.spansBothSemesters) {
            const leftEdge = columnX + (COL_WIDTH - SEMESTER_GAP) / 2 - SEMESTER_COL_WIDTH;
            width = SEMESTER_COL_WIDTH * 2 + SEMESTER_GAP;
            x = leftEdge;
        } else {
            const semesterOffset = course.semester === 1
                ? (COL_WIDTH - SEMESTER_GAP) / 2 - SEMESTER_COL_WIDTH + (SEMESTER_COL_WIDTH - CARD_WIDTH) / 2
                : (COL_WIDTH + SEMESTER_GAP) / 2 + (SEMESTER_COL_WIDTH - CARD_WIDTH) / 2;
            x = columnX + semesterOffset;
            width = CARD_WIDTH;
        }

        const y = PADDING_Y + COLUMN_PADDING_TOP + HEADER_HEIGHT + 16 + row * ROW_HEIGHT;
        positions[course.id] = { x, y, width, height: CARD_HEIGHT, row };
    });

    const canvasWidth = PADDING_X * 2 + 4 * COL_WIDTH;
    const columnHeight = COLUMN_PADDING_TOP + HEADER_HEIGHT + 16 + (maxRow + 1) * ROW_HEIGHT + COLUMN_PADDING_BOTTOM;
    const canvasHeight = PADDING_Y * 2 + columnHeight;

    return { positions, canvasWidth, canvasHeight, columnHeight };
}

function makeOrthogonalPath(from, to, fromId, toId, allPositions) {
    const x1 = from.x + from.width;
    const y1 = from.y + from.height / 2;
    const x2 = to.x;
    const y2 = to.y + to.height / 2;

    if (Math.abs(y1 - y2) < 1) {
        const blockingCard = findBlockingCard(x1, y1, x2, y2, fromId, toId, allPositions, true);
        if (!blockingCard) return `M ${x1},${y1} L ${x2},${y2}`;
        const bypassY = blockingCard.y - 12;
        return roundedPath([[x1, y1], [x1 + 8, y1], [x1 + 8, bypassY], [x2 - 8, bypassY], [x2 - 8, y2], [x2, y2]]);
    }

    let midX = x1 + (x2 - x1) / 2;
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const verticalBlock = findVerticalBlock(midX, minY, maxY, fromId, toId, allPositions);
    if (verticalBlock) {
        midX = verticalBlock.x + verticalBlock.width + 12;
        if (midX > x2 - 10) midX = x2 - 12;
    }

    const horizontalBlock1 = findBlockingCard(x1, y1, midX, y1, fromId, toId, allPositions, true);
    const horizontalBlock2 = findBlockingCard(midX, y2, x2, y2, fromId, toId, allPositions, true);

    if (horizontalBlock1 || horizontalBlock2) {
        const offset1 = horizontalBlock1 ? (horizontalBlock1.y > y1 ? -12 : 12) : 0;
        const offset2 = horizontalBlock2 ? (horizontalBlock2.y > y2 ? -12 : 12) : 0;
        return roundedPath([[x1, y1], [x1 + 6, y1], [x1 + 6, y1 + offset1], [midX, y1 + offset1], [midX, y2 + offset2], [x2 - 6, y2 + offset2], [x2 - 6, y2], [x2, y2]]);
    }
    return roundedPath([[x1, y1], [midX, y1], [midX, y2], [x2, y2]]);
}

function findBlockingCard(x1, y1, x2, y2, fromId, toId, allPositions, horizontalOnly) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (const [idStr, pos] of Object.entries(allPositions)) {
        const id = parseInt(idStr);
        if (id === fromId || id === toId) continue;
        if (horizontalOnly && y1 >= pos.y - 2 && y1 <= pos.y + pos.height + 2 && pos.x < maxX - 4 && pos.x + pos.width > minX + 4) {
            return pos;
        }
    }
    return null;
}

function findVerticalBlock(x, minY, maxY, fromId, toId, allPositions) {
    for (const [idStr, pos] of Object.entries(allPositions)) {
        const id = parseInt(idStr);
        if (id === fromId || id === toId) continue;
        if (x >= pos.x - 2 && x <= pos.x + pos.width + 2 && pos.y + pos.height > minY && pos.y < maxY) {
            return pos;
        }
    }
    return null;
}

function roundedPath(points) {
    if (points.length < 2) return '';
    const r = 5;
    let path = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length - 1; i++) {
        const [px, py] = points[i - 1];
        const [cx, cy] = points[i];
        const [nx, ny] = points[i + 1];
        const inDx = Math.sign(cx - px);
        const inDy = Math.sign(cy - py);
        const outDx = Math.sign(nx - cx);
        const outDy = Math.sign(ny - cy);
        const beforeX = cx - inDx * r;
        const beforeY = cy - inDy * r;
        const afterX = cx + outDx * r;
        const afterY = cy + outDy * r;
        path += ` L ${beforeX},${beforeY}`;
        if (inDx === outDx && inDy === outDy) {
            path += ` L ${cx},${cy}`;
        } else {
            path += ` Q ${cx},${cy} ${afterX},${afterY}`;
        }
    }
    path += ` L ${points[points.length - 1][0]},${points[points.length - 1][1]}`;
    return path;
}

// ===== [Detail 1 적용] 과목 카드 컴포넌트 업그레이드 =====
function CourseCard({ course, position, onClick, selected, dimmed, related, isAdmin, onEditClick }) {
    const track = tracks.find(t => t.id === course.category) || tracks[0];
    let borderColor = track.cardBorder;
    let bgColor = '#ffffff';
    let shadow = '0 1px 2px rgba(15, 23, 42, 0.06)';
    let opacity = 1;
    let borderWidth = 1.5;

    if (selected) {
        borderColor = '#4f46e5';
        bgColor = '#eef2ff';
        shadow = '0 6px 20px rgba(79, 70, 229, 0.3), 0 0 0 3px rgba(79, 70, 229, 0.12)';
        borderWidth = 2;
    } else if (related) {
        borderColor = '#f59e0b';
        bgColor = '#fffbeb';
        shadow = '0 3px 10px rgba(245, 158, 11, 0.2)';
        borderWidth = 2;
    }
    if (dimmed) opacity = 0.3;

    return (
        <div
            onClick={() => onClick(course)}
            style={{
                position: 'absolute', left: position.x, top: position.y, width: position.width, height: position.height,
                background: bgColor, border: `${borderWidth}px solid ${borderColor}`, borderRadius: 6,
                boxShadow: shadow, opacity, cursor: 'pointer', transition: 'all 0.2s ease',
                padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', zIndex: 2,
            }}
        >
            {/* 🔒 최고 관리자일 때만 카드 우측 상단에 미니 수정(톱니바퀴) 아이콘 강제 노출 */}
            {isAdmin && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // 카드 자체 선택 이벤트 전파 완전 차단
                        onEditClick(course);
                    }}
                    className="absolute top-1 right-1 w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all"
                    title="과목 정보 수정"
                >
                    <Settings size={10} />
                </button>
            )}

            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.25, width: '100%', wordBreak: 'keep-all', paddingRight: isAdmin ? '8px' : '0' }}>
                {course.title}
            </div>
            <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>
                {course.credits}학점
            </div>
        </div>
    );
}

function DetailPanel({ course, onClose, allCourses, edges, onSelectCourse }) {
    if (!course) {
        return (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: 14, background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Info size={22} className="text-indigo-500" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">과목을 선택해주세요</p>
                <p className="text-xs text-slate-500 leading-relaxed">좌측 트리에서 과목을 클릭하면<br />상세 정보와 선수관계가 표시됩니다</p>
            </div>
        );
    }

    const track = tracks.find(t => t.id === course.category) || tracks[0];
    const currentCode = course.courseCode || course.code || '';

    return (
        <div>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md ${track.bg} ${track.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${track.dot}`}></span>{track.label}
                    </span>
                    <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={15} /></button>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mb-1">{currentCode}</p>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{course.title}</h3>
            </div>
            <div className="grid grid-cols-3 gap-px bg-slate-100">
                <div className="bg-white px-3 py-3 text-center"><p className="text-[10px] text-slate-500 mb-1">학년</p><p className="text-sm font-bold text-slate-900">{course.gradeLevel || course.grade}학년</p></div>
                <div className="bg-white px-3 py-3 text-center"><p className="text-[10px] text-slate-500 mb-1">학기</p><p className="text-sm font-bold text-slate-900">{course.semester}학기</p></div>
                <div className="bg-white px-3 py-3 text-center"><p className="text-[10px] text-slate-500 mb-1">학점</p><p className="text-sm font-bold text-slate-900">{course.credits}</p></div>
            </div>
        </div>
    );
}

// ===== [Task 1 적용] 피그마 Pro 시안 커스텀 과목 입력 폼 모달 컴포넌트 추가 =====
function CourseFormModal({ isOpen, onClose, editingCourse }) {
    if (!isOpen) return null;

    // 수정 모드일 때 기존 데이터를 폼에 완전히 채워주고(Pre-filled), 등록 모드일 땐 깔끔한 빈값 세팅
    const [formData, setFormData] = useState({
        title: editingCourse?.title || '',
        courseCode: editingCourse?.courseCode || editingCourse?.code || '',
        credits: editingCourse?.credits || 3,
        category: editingCourse?.category || '공통',
        gradeLevel: editingCourse?.gradeLevel || editingCourse?.grade || 1,
        semester: editingCourse?.semester || 1
    });

    // 데이터 변경 추적 핸들러 싱크 최적화
    useEffect(() => {
        setFormData({
            title: editingCourse?.title || '',
            courseCode: editingCourse?.courseCode || editingCourse?.code || '',
            credits: editingCourse?.credits || 3,
            category: editingCourse?.category || '공통',
            gradeLevel: editingCourse?.gradeLevel || editingCourse?.grade || 1,
            semester: editingCourse?.semester || 1
        });
    }, [editingCourse, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.courseCode.trim()) {
            alert('과목명과 학수 코드는 필수 입력 데이터입니다.');
            return;
        }

        // 다음 11번 스케줄인 [Task 2: 백엔드 API 연동] 구역을 위해 미리 도선 확보
        if (editingCourse) {
            alert(`[PATCH 연동 스탠바이] 과목 ID ${editingCourse.id}번 데이터 수정 요청:\n` + JSON.stringify(formData, null, 2));
        } else {
            alert('[POST 연동 스탠바이] 신규 과목 등록 데이터 요청:\n' + JSON.stringify(formData, null, 2));
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-[420px] overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-600" />
                        {editingCourse ? '⚙️ 교과 과목 정보 수정' : '➕ 새로운 교과 과목 등록'}
                    </h3>
                    <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                        <X size={14} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">과목명 *</label>
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="예: 웹프로그래밍" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">과목 학수 코드 *</label>
                        <input type="text" value={formData.courseCode} onChange={e => setFormData({...formData, courseCode: e.target.value})} placeholder="예: CS0023" className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">개설 학년</label>
                            <select value={formData.gradeLevel} onChange={e => setFormData({...formData, gradeLevel: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                {[1,2,3,4].map(g => <option key={g} value={g}>{g}학년</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">개설 학기</label>
                            <select value={formData.semester} onChange={e => setFormData({...formData, semester: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                <option value={1}>1학기</option>
                                <option value={2}>2학기</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">학점수</label>
                            <select value={formData.credits} onChange={e => setFormData({...formData, credits: Number(e.target.value)})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                {[1,2,3,4].map(c => <option key={c} value={c}>{c}학점</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">이수 트랙 분류</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                <option value="공통">공통</option>
                                <option value="SW전공">SW전공</option>
                                <option value="컴공전공">컴공전공</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">취소</button>
                        <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all">
                            {editingCourse ? '수정 내용 저장' : '등록 완료'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===== 메인 컴포넌트 =====
export function MainPage({ onSwitchToAdmin } = {}) {
    const [isAdmin, setIsAdmin] = useState(() => {
        const savedRole = localStorage.getItem('user_role');
        return savedRole === 'ADMIN' || savedRole === 'INSTRUCTOR';
    });

    const [courses, setCourses] = useState([]);
    const [prerequisites, setPrerequisites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [search, setSearch] = useState('');
    const [gradeFilters, setGradeFilters] = useState({ 1: true, 2: true, 3: true, 4: true });
    const [trackFilters, setTrackFilters] = useState({ '공통': true, 'SW전공': true, '컴공전공': true });
    const [zoom, setZoom] = useState(1);
    const [autoFit, setAutoFit] = useState(true);
    const canvasContainerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // 🔥 10번 이슈 모달용 전역 제어 상태 변수 선언
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    const handleOpenNewModal = () => {
        setEditingCourse(null); // 신규 모드
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (course) => {
        setEditingCourse(course); // 기존 과목 데이터 주입수정 모드
        setIsModalOpen(true);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [courseData, preData] = await Promise.all([
                    courseApi.getAll(),
                    prerequisiteApi.getAll()
                ]);
                setCourses(courseData || []);
                setPrerequisites((preData || []).map(p => [p.preCourseId, p.postCourseId]));
            } catch (error) {
                console.error("데이터 로드 실패:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const checkRole = () => {
            const savedRole = localStorage.getItem('user_role');
            setIsAdmin(savedRole === 'ADMIN' || savedRole === 'INSTRUCTOR');
        };
        window.addEventListener('storage', checkRole);
        const interval = setInterval(checkRole, 1000);
        return () => {
            window.removeEventListener('storage', checkRole);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!canvasContainerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        });
        observer.observe(canvasContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const handleLogout = () => {
        localStorage.setItem('user_role', 'STUDENT');
        setIsAdmin(false);
        setSelectedCourse(null);
        alert('성공적으로 로그아웃되었습니다. 학생 조회 모드로 귀환합니다.');
    };

    const visibleCourses = useMemo(() => {
        if (!courses) return [];
        return courses.filter((c) => {
            if (!c) return false;
            const currentGrade = c.gradeLevel !== undefined ? c.gradeLevel : c.grade;
            const currentCode = c.courseCode || c.code || '';
            const currentTitle = c.title || '';

            if (currentGrade && !gradeFilters[currentGrade]) return false;
            if (c.category && !trackFilters[c.category]) return false;
            if (search.trim() !== '') {
                const q = search.trim().toLowerCase();
                if (!currentTitle.toLowerCase().includes(q) && !currentCode.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [search, gradeFilters, trackFilters, courses]);

    const layout = useMemo(() => computeLayout(visibleCourses), [visibleCourses]);

    const fitZoom = useMemo(() => {
        if (!containerSize.width || !containerSize.height || !layout.canvasWidth || !layout.canvasHeight) return 1;
        const zoomX = (containerSize.width - 16) / layout.canvasWidth;
        const zoomY = (containerSize.height - 16) / layout.canvasHeight;
        return Math.max(Math.min(zoomX, zoomY, 1.2), 0.3);
    }, [containerSize, layout.canvasWidth, layout.canvasHeight]);

    const effectiveZoom = autoFit ? fitZoom : zoom;

    const { related } = useMemo(() => {
        if (!selectedCourse) return { related: new Set() };
        const rel = new Set();
        prerequisites.forEach(([pre, post]) => {
            if (post === selectedCourse.id) rel.add(pre);
            if (pre === selectedCourse.id) rel.add(post);
        });
        return { related: rel };
    }, [selectedCourse, prerequisites]);

    const visibleEdges = useMemo(() => {
        if (!visibleCourses.length || !courses.length) return [];
        const visibleIds = new Set(visibleCourses.map(c => c.id));
        const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));
        return prerequisites.filter(([a, b]) => {
            if (!visibleIds.has(a) || !visibleIds.has(b)) return false;
            const ca = courseMap[a];
            const cb = courseMap[b];
            if (!ca || !cb) return false;
            const gradeA = ca.gradeLevel !== undefined ? ca.gradeLevel : ca.grade;
            const gradeB = cb.gradeLevel !== undefined ? cb.gradeLevel : cb.grade;
            if (gradeA === gradeB && ca.semester === cb.semester) return false;
            return true;
        });
    }, [visibleCourses, courses, prerequisites]);

    const handleCardClick = (course) => {
        setSelectedCourse(prev => prev?.id === course.id ? null : course);
    };

    const resetFilters = () => {
        setSearch('');
        setGradeFilters({ 1: true, 2: true, 3: true, 4: true });
        setTrackFilters({ '공통': true, 'SW전공': true, '컴공전공': true });
    };

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Pretendard', sans-serif" }}>
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/90">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
                            <GitBranch size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 leading-tight">Tree Navigator</h1>
                            <p className="text-xs text-slate-500 leading-tight">컴퓨터공학부 교과과정 이수 체계도</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAdmin ? (
                            <div className="px-3 py-1.5 bg-rose-50 rounded-md border border-rose-100 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                <span className="text-xs font-semibold text-rose-700">최고 관리자 모드</span>
                            </div>
                        ) : (
                            <div className="px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200">
                                <span className="text-xs font-medium text-slate-600">학생 조회 모드</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="px-4 py-4">
                <div className="flex gap-3" style={{ height: 'calc(100vh - 96px)' }}>
                    <aside className="w-56 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden flex-shrink-0">
                        <div className="p-4 border-b border-slate-100">
                            <h2 className="text-xs font-semibold text-slate-700 uppercase mb-3 flex items-center gap-1.5"><Search size={12} />검색</h2>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="과목명 검색..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                            </div>
                        </div>
                        <div className="p-4 border-b border-slate-100 flex-1 overflow-y-auto">
                            <h2 className="text-xs font-semibold text-slate-700 uppercase mb-3 flex items-center gap-1.5"><Layers size={12} />학년</h2>
                            <div className="space-y-1.5 mb-5">
                                {[1, 2, 3, 4].map((g) => (
                                    <label key={g} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer">
                                        <input type="checkbox" checked={gradeFilters[g]} onChange={(e) => setGradeFilters({ ...gradeFilters, [g]: e.target.checked })} className="w-4 h-4 rounded text-indigo-600" />
                                        <span className="text-sm text-slate-700">{g}학년</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="p-3 border-t border-slate-100 space-y-2">
                            <button onClick={resetFilters} className="w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md">필터 초기화</button>

                            {/* 🔒 관리자 전용 편집 패널 */}
                            {isAdmin && (
                                <div className="pt-2 mt-1 bg-slate-50/50 p-2 rounded-lg border border-dashed border-slate-300 space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">교과과정 편집툴</p>

                                    {/* 💡 [Task 1 연결] 신규 등록 모달 열기 매핑 */}
                                    <button onClick={handleOpenNewModal} className="w-full px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"><Plus size={12} /> 과목 신규 등록</button>

                                    <button onClick={onSwitchToAdmin} className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border rounded-md hover:bg-slate-50 transition-colors"><Settings size={12} /> 대시보드</button>

                                    <button onClick={handleLogout} className="w-full px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center justify-center gap-1">
                                        <LogOut size={11} /> 로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    </aside>

                    <section className={`flex-1 bg-white border rounded-xl overflow-hidden relative flex flex-col min-w-0 ${isAdmin ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200'}`}>
                        {isAdmin && (
                            <div className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[11px] font-medium px-4 py-1 z-10">
                                <span>⚠️ 최고 관리자 권한 상태입니다. 좌측 툴을 이용하거나 과목 카드의 설정 단추를 통해 교과 트리를 편집할 수 있습니다.</span>
                            </div>
                        )}
                        <div ref={canvasContainerRef} className="flex-1 overflow-hidden bg-slate-50/30 relative">
                            {visibleCourses.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center"><p className="text-sm text-slate-500">표시할 과목이 없습니다.</p></div>
                            ) : (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', width: layout.canvasWidth * effectiveZoom, height: layout.canvasHeight * effectiveZoom, transform: 'translate(-50%, -50%)' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: layout.canvasWidth, height: layout.canvasHeight, transform: `scale(${effectiveZoom})`, transformOrigin: '0 0' }}>
                                        {[1, 2, 3, 4].map((g, i) => {
                                            const style = gradeStyle[g];
                                            return (
                                                <div key={g} style={{ position: 'absolute', left: PADDING_X + i * COL_WIDTH, top: PADDING_Y, width: COL_WIDTH, height: layout.columnHeight, background: style.bg, border: '1px dashed #cbd5e1', borderRadius: 8, zIndex: 0 }}>
                                                    <div style={{ position: 'absolute', top: COLUMN_PADDING_TOP, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 24px)', height: HEADER_HEIGHT - 8, background: style.headerBg, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: 14, fontWeight: 700, color: style.headerText }}>{g}학년</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <svg style={{ position: 'absolute', top: 0, left: 0, width: layout.canvasWidth, height: layout.canvasHeight, pointerEvents: 'none', zIndex: 1 }}>
                                            {visibleEdges.map(([pre, post], idx) => {
                                                const fromPos = layout.positions[pre];
                                                const toPos = layout.positions[post];
                                                if (!fromPos || !toPos) return null;
                                                const isActive = selectedCourse && (selectedCourse.id === pre || selectedCourse.id === post);
                                                return (
                                                    <path key={idx} d={makeOrthogonalPath(fromPos, toPos, pre, post, layout.positions)} fill="none" stroke={isActive ? '#4f46e5' : '#94a3b8'} strokeWidth={isActive ? 2 : 1.2} />
                                                );
                                            })}
                                        </svg>

                                        {/* 🔥 [Detail 1 연결] 개별 카드 마운트 구역에 isAdmin 및 수정 핸들러 이식 */}
                                        {visibleCourses.map((course) => {
                                            const pos = layout.positions[course.id];
                                            if (!pos) return null;
                                            return (
                                                <CourseCard
                                                    key={course.id}
                                                    course={course}
                                                    position={pos}
                                                    onClick={handleCardClick}
                                                    selected={selectedCourse?.id === course.id}
                                                    related={related.has(course.id)}
                                                    dimmed={selectedCourse && selectedCourse.id !== course.id && !related.has(course.id)}
                                                    isAdmin={isAdmin}
                                                    onEditClick={handleOpenEditModal}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="absolute bottom-4 left-4 flex flex-col gap-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            <button onClick={() => { setAutoFit(false); setZoom(z => Math.min(2, (autoFit ? fitZoom : z) + 0.1)); }} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors" title="확대"><Plus size={14} /></button>
                            <div className="px-1 py-0.5 text-[10px] text-center text-slate-500 tabular-nums border-y border-slate-100 bg-slate-50">{Math.round(effectiveZoom * 100)}%</div>
                            <button onClick={() => { setAutoFit(false); setZoom(z => Math.max(0.3, (autoFit ? fitZoom : z) - 0.1)); }} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors" title="축소"><Minus size={14} /></button>
                            <button onClick={() => setAutoFit(true)} className={`w-8 h-8 flex items-center justify-center transition-colors border-t border-slate-100 ${autoFit ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`} title="화면에 맞춤"><Maximize2 size={12} /></button>
                        </div>
                    </section>

                    <aside className="w-64 bg-white border border-slate-200 rounded-xl overflow-y-auto flex-shrink-0">
                        <DetailPanel course={selectedCourse} onClose={() => setSelectedCourse(null)} allCourses={courses} edges={prerequisites} onSelectCourse={setSelectedCourse} />
                    </aside>
                </div>
            </div>

            {/* 💡 [Task 1 연결] 최종 모달 레이어 컴포넌트 렌더링 주입 */}
            <CourseFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingCourse={editingCourse} />
        </div>
    );
}

export default MainPage;