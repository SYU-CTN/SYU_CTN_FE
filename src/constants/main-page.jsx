import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, BookOpen, Settings, Users, X, GitBranch, ChevronRight, Info, Layers, MessageCircle, Plus, Minus, Maximize2, LogOut, Move, GripVertical, Save, RotateCcw } from 'lucide-react';

import { courseApi, prerequisiteApi } from './api.js';

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

// ===== 레이아웃 상수 =====
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
const MAX_ROWS = 20; // 드래그 시 사용할 최대 row 수

// ===== 기본 layoutOverride (하드코딩된 위치) =====
const DEFAULT_LAYOUT_OVERRIDE = {
    101: { row: 0 }, 102: { row: 2 },
    103: { row: 0 }, 104: { row: 3 }, 105: { row: 9 },
    106: { row: 0 }, 107: { row: 1 }, 108: { row: 2 }, 109: { row: 5 }, 110: { row: 6 }, 111: { row: 7 }, 112: { row: 9 },
    113: { row: 0 }, 114: { row: 1 }, 115: { row: 2 }, 116: { row: 3 }, 117: { row: 5 }, 118: { row: 7 }, 119: { row: 9 }, 120: { row: 10 },
    121: { row: 2 }, 122: { row: 3 }, 123: { row: 4 }, 124: { row: 5 }, 125: { row: 7 }, 126: { row: 8 }, 127: { row: 9 }, 128: { row: 10 }, 129: { row: 11 }, 130: { row: 12 },
    131: { row: 0 }, 132: { row: 1 }, 133: { row: 5 }, 134: { row: 6 }, 135: { row: 7 }, 136: { row: 9 }, 137: { row: 10 }, 138: { row: 11 },
    139: { row: 0 }, 140: { row: 1 }, 141: { row: 2 }, 142: { row: 5 }, 143: { row: 6 }, 144: { row: 7 }, 145: { row: 8 }, 146: { row: 9 }, 147: { row: 10 }, 148: { row: 11 },
    149: { row: 0 }, 150: { row: 1 }, 151: { row: 4 }, 152: { row: 7 }, 153: { row: 9 }, 154: { row: 10 }, 155: { row: 11 },
};

// ===== 레이아웃 계산 =====
function computeLayout(visibleCourses, layoutOverride) {
    const positions = {};
    let maxRow = 0;

    visibleCourses.forEach((course) => {
        const override = layoutOverride[course.id];
        const row = override?.row ?? 0;
        if (row > maxRow) maxRow = row;

        const colIdx = course.grade - 1;
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

// ===== 연결선 경로 계산 =====
function makeOrthogonalPath(from, to, fromId, toId, allPositions) {
    const x1 = from.x + from.width;
    const y1 = from.y + from.height / 2;
    const x2 = to.x;
    const y2 = to.y + to.height / 2;

    if (Math.abs(y1 - y2) < 1) {
        const blockingCard = findBlockingCard(x1, y1, x2, y2, fromId, toId, allPositions, true);
        if (!blockingCard) return `M ${x1},${y1} L ${x2},${y2}`;
        const bypassY = blockingCard.y - 12;
        return roundedPath([[x1, y1],[x1 + 8, y1],[x1 + 8, bypassY],[x2 - 8, bypassY],[x2 - 8, y2],[x2, y2]]);
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
        return roundedPath([[x1, y1],[x1 + 6, y1],[x1 + 6, y1 + offset1],[midX, y1 + offset1],[midX, y2 + offset2],[x2 - 6, y2 + offset2],[x2 - 6, y2],[x2, y2]]);
    }

    return roundedPath([[x1, y1],[midX, y1],[midX, y2],[x2, y2]]);
}

function findBlockingCard(x1, y1, x2, y2, fromId, toId, allPositions, horizontalOnly) {
    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
    for (const [idStr, pos] of Object.entries(allPositions)) {
        const id = parseInt(idStr);
        if (id === fromId || id === toId) continue;
        if (horizontalOnly) {
            if (y1 >= pos.y - 2 && y1 <= pos.y + pos.height + 2 && pos.x < maxX - 4 && pos.x + pos.width > minX + 4) return pos;
        } else {
            if (pos.x < maxX && pos.x + pos.width > minX && pos.y < Math.max(y1,y2) && pos.y + pos.height > Math.min(y1,y2)) return pos;
        }
    }
    return null;
}

function findVerticalBlock(x, minY, maxY, fromId, toId, allPositions) {
    for (const [idStr, pos] of Object.entries(allPositions)) {
        const id = parseInt(idStr);
        if (id === fromId || id === toId) continue;
        if (x >= pos.x - 2 && x <= pos.x + pos.width + 2 && pos.y + pos.height > minY && pos.y < maxY) return pos;
    }
    return null;
}

function roundedPath(points) {
    if (points.length < 2) return '';
    const r = 5;
    let path = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length - 1; i++) {
        const [px, py] = points[i - 1], [cx, cy] = points[i], [nx, ny] = points[i + 1];
        const inDx = Math.sign(cx - px), inDy = Math.sign(cy - py);
        const outDx = Math.sign(nx - cx), outDy = Math.sign(ny - cy);
        path += ` L ${cx - inDx * r},${cy - inDy * r}`;
        if (inDx === outDx && inDy === outDy) path += ` L ${cx},${cy}`;
        else path += ` Q ${cx},${cy} ${cx + outDx * r},${cy + outDy * r}`;
    }
    const last = points[points.length - 1];
    path += ` L ${last[0]},${last[1]}`;
    return path;
}

// ===== 드래그 가능한 카드 컴포넌트 =====
function CourseCard({ course, position, onClick, selected, dimmed, related, isDragMode, onDragStart, isDragging }) {
    const track = tracks.find(t => t.id === course.category) || tracks[0];

    let borderColor = track.cardBorder;
    let bgColor = '#ffffff';
    let shadow = '0 1px 2px rgba(15, 23, 42, 0.06)';
    let opacity = isDragging ? 0.4 : 1;
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

    if (dimmed && !isDragging) opacity = 0.3;

    const handleMouseDown = (e) => {
        if (isDragMode) {
            e.preventDefault();
            e.stopPropagation();
            onDragStart(e, course);
        }
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onClick={isDragMode ? undefined : () => onClick(course)}
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: position.width,
                height: position.height,
                background: bgColor,
                border: `${borderWidth}px solid ${borderColor}`,
                borderRadius: 6,
                boxShadow: shadow,
                opacity,
                cursor: isDragMode ? 'grab' : 'pointer',
                transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: '6px 8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                userSelect: 'none',
                zIndex: 2,
            }}
            onMouseEnter={(e) => {
                if (!selected && !dimmed && !isDragMode) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)';
                }
            }}
            onMouseLeave={(e) => {
                if (!selected && !dimmed && !isDragMode) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadow;
                }
            }}
        >
            {isDragMode && (
                <div style={{
                    position: 'absolute', top: 3, right: 4,
                    color: '#94a3b8', opacity: 0.6,
                }}>
                    <GripVertical size={10} />
                </div>
            )}
            <div style={{
                fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.25,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', wordBreak: 'keep-all', width: '100%',
            }}>
                {course.title}
            </div>
            <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>
                {course.credits}학점
            </div>
        </div>
    );
}

// ===== 드래그 고스트 카드 =====
function GhostCard({ course, x, y, width }) {
    const track = tracks.find(t => t.id === course.category) || tracks[0];
    return (
        <div style={{
            position: 'fixed', left: x, top: y, width, height: CARD_HEIGHT,
            background: '#eef2ff',
            border: '2px solid #4f46e5',
            borderRadius: 6,
            boxShadow: '0 12px 32px rgba(79, 70, 229, 0.35)',
            padding: '6px 8px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            textAlign: 'center', pointerEvents: 'none', zIndex: 9999,
            opacity: 0.92,
            transform: 'rotate(2deg) scale(1.04)',
        }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3730a3', lineHeight: 1.25, wordBreak: 'keep-all', width: '100%' }}>
                {course.title}
            </div>
            <div style={{ fontSize: 9.5, color: '#818cf8', marginTop: 3, fontWeight: 500 }}>
                {course.credits}학점
            </div>
        </div>
    );
}

// ===== 드롭 스냅 하이라이트 =====
function SnapHighlight({ snapTarget, layout, effectiveZoom, canvasOffset }) {
    if (!snapTarget) return null;
    const { grade, semester, row } = snapTarget;
    const colIdx = grade - 1;
    const columnX = PADDING_X + colIdx * COL_WIDTH;
    const semesterOffset = semester === 1
        ? (COL_WIDTH - SEMESTER_GAP) / 2 - SEMESTER_COL_WIDTH + (SEMESTER_COL_WIDTH - CARD_WIDTH) / 2
        : (COL_WIDTH + SEMESTER_GAP) / 2 + (SEMESTER_COL_WIDTH - CARD_WIDTH) / 2;
    const x = columnX + semesterOffset;
    const y = PADDING_Y + COLUMN_PADDING_TOP + HEADER_HEIGHT + 16 + row * ROW_HEIGHT;

    return (
        <div style={{
            position: 'absolute',
            left: (x * effectiveZoom) + canvasOffset.x,
            top: (y * effectiveZoom) + canvasOffset.y,
            width: CARD_WIDTH * effectiveZoom,
            height: CARD_HEIGHT * effectiveZoom,
            border: '2px dashed #4f46e5',
            borderRadius: 6 * effectiveZoom,
            background: 'rgba(79, 70, 229, 0.08)',
            pointerEvents: 'none',
            zIndex: 10,
            transition: 'all 0.1s ease',
        }} />
    );
}

// ===== 상세 패널 =====
function DetailPanel({ course, onClose, allCourses, edges, onSelectCourse }) {
    if (!course) {
        return (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{
                    width: 56, height: 56, margin: '0 auto 16px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Info size={22} color="#6366f1" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>과목을 선택해주세요</p>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                    좌측 트리에서 과목을 클릭하면<br />상세 정보와 선수관계가 표시됩니다
                </p>
            </div>
        );
    }

    const track = tracks.find(t => t.id === course.category) || tracks[0];
    const prereqs = edges.filter(([_, post]) => post === course.id).map(([pre]) => allCourses.find(c => c.id === pre)).filter(Boolean);
    const nextCourses = edges.filter(([pre]) => pre === course.id).map(([_, post]) => allCourses.find(c => c.id === post)).filter(Boolean);

    return (
        <div>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                        fontSize: 11, fontWeight: 500, borderRadius: 6,
                        background: track.bg.replace('bg-', ''), color: '#334155',
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: track.dot.includes('slate') ? '#64748b' : track.dot.includes('emerald') ? '#10b981' : '#6366f1', display: 'inline-block' }} />
                        {track.label}
                    </span>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <X size={15} />
                    </button>
                </div>
                <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', marginBottom: 4 }}>{course.code}</p>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, margin: 0 }}>{course.title}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: '#f1f5f9' }}>
                {[['학년', `${course.grade}학년`], ['학기', `${course.semester}학기`], ['학점', course.credits]].map(([label, val]) => (
                    <div key={label} style={{ background: '#fff', padding: '10px 4px', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{val}</p>
                    </div>
                ))}
            </div>

            {[{ label: '선수 과목', color: '#fbbf24', items: prereqs }, { label: '후속 과목', color: '#818cf8', items: nextCourses }].map(({ label, color, items }) => (
                <div key={label} style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <div style={{ width: 3, height: 14, borderRadius: 2, background: color }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>({items.length})</span>
                    </div>
                    {items.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', paddingLeft: 10, margin: 0 }}>없음</p>
                    ) : items.map(p => {
                        const t = tracks.find(tr => tr.id === p.category);
                        return (
                            <div key={p.id} onClick={() => onSelectCourse(p)} style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                                borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s',
                            }}
                                 onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot.includes('slate') ? '#64748b' : t.dot.includes('emerald') ? '#10b981' : '#6366f1', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                                    <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', margin: 0 }}>{p.code} · {p.grade}학년 {p.semester}학기</p>
                                </div>
                                <ChevronRight size={12} color="#cbd5e1" />
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

// ===== 메인 =====
export function MainPage({ isAdmin = false, onSwitchToAdmin, onLogout } = {}) {
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

    // ===== 드래그&드롭 상태 =====
    const [isDragMode, setIsDragMode] = useState(false);
    const [dragging, setDragging] = useState(null); // { course, startX, startY, currentX, currentY }
    const [snapTarget, setSnapTarget] = useState(null); // { grade, semester, row }
    const [layoutOverride, setLayoutOverride] = useState(() => {
        // 로컬스토리지에서 저장된 레이아웃 불러오기
        try {
            const saved = localStorage.getItem('courseLayoutOverride');
            return saved ? JSON.parse(saved) : { ...DEFAULT_LAYOUT_OVERRIDE };
        } catch { return { ...DEFAULT_LAYOUT_OVERRIDE }; }
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 }); // 카드 내 클릭 위치 오프셋

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [courseData, preData] = await Promise.all([
                    courseApi.getAll(),
                    prerequisiteApi.getAll()
                ]);
                setCourses(courseData);
                setPrerequisites(preData.map(p => [p.preCourseId, p.postCourseId]));
            } catch (error) {
                console.error("데이터 로드 실패:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // 컨테이너 크기 측정
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

    const visibleCourses = useMemo(() => {
        return courses.filter((c) => {
            if (!gradeFilters[c.grade]) return false;
            if (!trackFilters[c.category]) return false;
            if (search.trim() !== '') {
                const q = search.trim().toLowerCase();
                if (!c.title.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [search, gradeFilters, trackFilters, courses]);

    const layout = useMemo(() => computeLayout(visibleCourses, layoutOverride), [visibleCourses, layoutOverride]);

    const fitZoom = useMemo(() => {
        if (!containerSize.width || !containerSize.height || !layout.canvasWidth || !layout.canvasHeight) return 1;
        const zoomX = (containerSize.width - 16) / layout.canvasWidth;
        const zoomY = (containerSize.height - 16) / layout.canvasHeight;
        return Math.max(Math.min(zoomX, zoomY, 1.2), 0.3);
    }, [containerSize, layout.canvasWidth, layout.canvasHeight]);

    const effectiveZoom = autoFit ? fitZoom : zoom;

    // 캔버스 내 실제 오프셋 (중앙 정렬)
    const canvasOffset = useMemo(() => {
        if (!containerSize.width || !containerSize.height) return { x: 0, y: 0 };
        return {
            x: (containerSize.width - layout.canvasWidth * effectiveZoom) / 2,
            y: (containerSize.height - layout.canvasHeight * effectiveZoom) / 2,
        };
    }, [containerSize, layout.canvasWidth, layout.canvasHeight, effectiveZoom]);

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
        const visibleIds = new Set(visibleCourses.map(c => c.id));
        const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));
        return prerequisites.filter(([a, b]) => {
            if (!visibleIds.has(a) || !visibleIds.has(b)) return false;
            const ca = courseMap[a], cb = courseMap[b];
            if (ca?.grade === cb?.grade && ca?.semester === cb?.semester) return false;
            return true;
        });
    }, [visibleCourses, prerequisites, courses]);

    // ===== 마우스 좌표 → 캔버스 좌표 변환 =====
    const screenToCanvas = useCallback((screenX, screenY) => {
        const rect = canvasContainerRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const relX = screenX - rect.left - canvasOffset.x;
        const relY = screenY - rect.top - canvasOffset.y;
        return { x: relX / effectiveZoom, y: relY / effectiveZoom };
    }, [canvasOffset, effectiveZoom]);

    // ===== 캔버스 좌표 → 스냅 타겟 (grade, semester, row) =====
    const canvasToSnap = useCallback((canvasX, canvasY) => {
        // grade 계산
        const gradeIdx = Math.floor((canvasX - PADDING_X) / COL_WIDTH);
        const grade = Math.max(1, Math.min(4, gradeIdx + 1));

        // semester 계산 (학년 내 상대 X)
        const colX = canvasX - PADDING_X - (grade - 1) * COL_WIDTH;
        const semester = colX < COL_WIDTH / 2 ? 1 : 2;

        // row 계산
        const contentY = canvasY - PADDING_Y - COLUMN_PADDING_TOP - HEADER_HEIGHT - 16;
        const row = Math.max(0, Math.min(MAX_ROWS - 1, Math.round(contentY / ROW_HEIGHT)));

        return { grade, semester, row };
    }, []);

    // ===== 드래그 시작 =====
    const handleDragStart = useCallback((e, course) => {
        if (!isDragMode) return;

        const rect = canvasContainerRef.current?.getBoundingClientRect();
        const pos = layout.positions[course.id];
        if (!pos || !rect) return;

        // 카드 내 클릭 위치 계산 (고스트 카드 정렬용)
        const cardScreenX = pos.x * effectiveZoom + canvasOffset.x + rect.left;
        const cardScreenY = pos.y * effectiveZoom + canvasOffset.y + rect.top;
        dragOffsetRef.current = {
            x: e.clientX - cardScreenX,
            y: e.clientY - cardScreenY,
        };

        setDragging({ course, currentX: e.clientX, currentY: e.clientY });
        setSelectedCourse(null);

        // 현재 스냅 계산
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        if (canvasPos) setSnapTarget(canvasToSnap(canvasPos.x, canvasPos.y));
    }, [isDragMode, layout.positions, effectiveZoom, canvasOffset, screenToCanvas, canvasToSnap]);

    // ===== 드래그 중 =====
    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e) => {
            setDragging(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
            const canvasPos = screenToCanvas(e.clientX, e.clientY);
            if (canvasPos) setSnapTarget(canvasToSnap(canvasPos.x, canvasPos.y));
        };

        const handleMouseUp = (e) => {
            if (!dragging) return;
            const canvasPos = screenToCanvas(e.clientX, e.clientY);
            if (canvasPos) {
                const snap = canvasToSnap(canvasPos.x, canvasPos.y);
                const courseId = dragging.course.id;

                // 새 위치 적용
                setLayoutOverride(prev => {
                    const next = {
                        ...prev,
                        [courseId]: { row: snap.row },
                    };
                    return next;
                });

                // 과목의 grade/semester 업데이트는 courses 상태에서 처리
                // (실제로는 백엔드 API 호출 필요)
                setCourses(prev => prev.map(c =>
                    c.id === courseId ? { ...c, grade: snap.grade, semester: snap.semester } : c
                ));

                setHasUnsavedChanges(true);
            }
            setDragging(null);
            setSnapTarget(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, screenToCanvas, canvasToSnap]);

    // ===== 레이아웃 저장 =====
    const handleSaveLayout = async () => {
        try {
            localStorage.setItem('courseLayoutOverride', JSON.stringify(layoutOverride));
            // 실제 구현 시: await courseApi.updatePositions(layoutOverride);
            setHasUnsavedChanges(false);
            alert('레이아웃이 저장되었습니다.');
        } catch (e) {
            alert('저장 실패: ' + e.message);
        }
    };

    // ===== 레이아웃 초기화 =====
    const handleResetLayout = () => {
        if (!window.confirm('레이아웃을 기본값으로 초기화하시겠습니까?')) return;
        setLayoutOverride({ ...DEFAULT_LAYOUT_OVERRIDE });
        localStorage.removeItem('courseLayoutOverride');
        setHasUnsavedChanges(false);
    };

    const handleCardClick = (course) => {
        if (isDragMode) return;
        setSelectedCourse(prev => prev?.id === course.id ? null : course);
    };

    const resetFilters = () => {
        setSearch('');
        setGradeFilters({ 1: true, 2: true, 3: true, 4: true });
        setTrackFilters({ '공통': true, 'SW전공': true, '컴공전공': true });
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}>
            <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />

            {/* 드래그 모드 배너 */}
            {isDragMode && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                    background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                    padding: '8px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Move size={14} color="white" />
                        <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>위치 편집 모드</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>카드를 드래그하여 위치를 변경하세요</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {hasUnsavedChanges && (
                            <>
                                <button onClick={handleResetLayout} style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                }}>
                                    <RotateCcw size={12} /> 초기화
                                </button>
                                <button onClick={handleSaveLayout} style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                                    background: 'white', border: 'none',
                                    borderRadius: 6, color: '#4f46e5', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    <Save size={12} /> 저장
                                </button>
                            </>
                        )}
                        <button onClick={() => { setIsDragMode(false); setDragging(null); setSnapTarget(null); }} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                            borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        }}>
                            <X size={12} /> 편집 종료
                        </button>
                    </div>
                </div>
            )}

            <header style={{
                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #e2e8f0',
                position: 'sticky', top: isDragMode ? 36 : 0, zIndex: 40,
            }}>
                <div style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                        }}>
                            <GitBranch size={18} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>Tree Navigator</h1>
                            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.2, margin: 0 }}>컴퓨터공학부 교과과정 이수 체계도</p>
                        </div>
                    </div>

                    {isAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#eef2ff', borderRadius: 8, border: '1px solid #e0e7ff' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#4f46e5' }}>관리자 계정</span>
                        </div>
                    )}
                </div>
            </header>

            <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: 12, height: `calc(100vh - ${isDragMode ? 132 : 96}px)` }}>

                    {/* 좌측 패널 */}
                    <aside style={{
                        width: 220, background: 'white', border: '1px solid #e2e8f0',
                        borderRadius: 12, display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', flexShrink: 0,
                    }}>
                        <div style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text" value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="과목명 검색..."
                                    style={{
                                        width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                                        fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8,
                                        outline: 'none', boxSizing: 'border-box',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: 16, borderBottom: '1px solid #f1f5f9', flex: 1, overflowY: 'auto' }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>학년</p>
                            {[1, 2, 3, 4].map((g) => (
                                <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 2 }}>
                                    <input type="checkbox" checked={gradeFilters[g]}
                                           onChange={(e) => setGradeFilters({ ...gradeFilters, [g]: e.target.checked })}
                                           style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#6366f1' }} />
                                    <span style={{ fontSize: 13, color: '#334155' }}>{g}학년</span>
                                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>{courses.filter(c => c.grade === g).length}</span>
                                </label>
                            ))}

                            <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, marginTop: 16 }}>트랙</p>
                            {tracks.map((t) => (
                                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 2 }}>
                                    <input type="checkbox" checked={trackFilters[t.id]}
                                           onChange={(e) => setTrackFilters({ ...trackFilters, [t.id]: e.target.checked })}
                                           style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#6366f1' }} />
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot.includes('slate') ? '#64748b' : t.dot.includes('emerald') ? '#10b981' : '#6366f1', flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, color: '#334155' }}>{t.label}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>{courses.filter(c => c.category === t.id).length}</span>
                                </label>
                            ))}
                        </div>

                        <div style={{ padding: 12, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button onClick={resetFilters} style={{
                                width: '100%', padding: '8px 12px', fontSize: 12, fontWeight: 500,
                                color: '#475569', background: 'transparent', border: 'none',
                                borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                필터 초기화
                            </button>
                            <button style={{
                                width: '100%', padding: '9px 12px', fontSize: 12, fontWeight: 600,
                                color: 'white', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                                <MessageCircle size={13} /> AI 상담
                            </button>

                            {isAdmin && (
                                <>
                                    {/* 위치 편집 버튼 */}
                                    <button
                                        onClick={() => setIsDragMode(m => !m)}
                                        style={{
                                            width: '100%', padding: '9px 12px', fontSize: 12, fontWeight: 600,
                                            color: isDragMode ? '#4f46e5' : '#334155',
                                            background: isDragMode ? '#eef2ff' : '#f1f5f9',
                                            border: isDragMode ? '1px solid #c7d2fe' : '1px solid transparent',
                                            borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            transition: 'all 0.2s',
                                        }}>
                                        <Move size={13} /> {isDragMode ? '편집 중...' : '카드 위치 편집'}
                                    </button>

                                    <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                                    <button onClick={onSwitchToAdmin} style={{
                                        width: '100%', padding: '8px 12px', fontSize: 12, fontWeight: 600,
                                        color: '#334155', background: '#f1f5f9', border: 'none',
                                        borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    }}>
                                        <Settings size={13} /> 관리자 대시보드
                                    </button>
                                    <button onClick={onLogout} style={{
                                        width: '100%', padding: '8px 12px', fontSize: 12, fontWeight: 500,
                                        color: '#ef4444', background: 'transparent', border: 'none',
                                        borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    }}>
                                        <LogOut size={12} /> 로그아웃
                                    </button>
                                </>
                            )}
                        </div>
                    </aside>

                    {/* 중앙 캔버스 */}
                    <section style={{
                        flex: 1, background: 'white', border: isDragMode ? '2px solid #c7d2fe' : '1px solid #e2e8f0',
                        borderRadius: 12, overflow: 'hidden', position: 'relative',
                        display: 'flex', flexDirection: 'column', minWidth: 0,
                        transition: 'border-color 0.2s',
                    }}>
                        <div
                            ref={canvasContainerRef}
                            style={{ flex: 1, overflow: 'hidden', background: isDragMode ? 'rgba(238,242,255,0.3)' : 'rgba(248,250,252,0.3)', position: 'relative' }}
                        >
                            {visibleCourses.length === 0 ? (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                            <Search size={22} color="#94a3b8" />
                                        </div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>표시할 과목이 없습니다</p>
                                        <p style={{ fontSize: 12, color: '#94a3b8' }}>필터를 조정하거나 검색어를 변경해보세요</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* 드래그 스냅 하이라이트 (캔버스 기준으로 절대 위치) */}
                                    {isDragMode && dragging && snapTarget && (
                                        <SnapHighlight
                                            snapTarget={snapTarget}
                                            layout={layout}
                                            effectiveZoom={effectiveZoom}
                                            canvasOffset={canvasOffset}
                                        />
                                    )}

                                    <div style={{
                                        position: 'absolute',
                                        top: '50%', left: '50%',
                                        width: layout.canvasWidth * effectiveZoom,
                                        height: layout.canvasHeight * effectiveZoom,
                                        transform: 'translate(-50%, -50%)',
                                    }}>
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0,
                                            width: layout.canvasWidth, height: layout.canvasHeight,
                                            transform: `scale(${effectiveZoom})`,
                                            transformOrigin: '0 0',
                                        }}>
                                            {/* 학년 칼럼 배경 */}
                                            {[1, 2, 3, 4].map((g, i) => {
                                                const left = PADDING_X + i * COL_WIDTH;
                                                const style = gradeStyle[g];
                                                return (
                                                    <div key={g} style={{
                                                        position: 'absolute', left, top: PADDING_Y,
                                                        width: COL_WIDTH, height: layout.columnHeight,
                                                        background: isDragMode ? style.bg.replace('f5', 'f0').replace('e8', 'e0') : style.bg,
                                                        border: isDragMode ? '1px dashed #a5b4fc' : '1px dashed #cbd5e1',
                                                        borderRadius: 8, zIndex: 0,
                                                    }}>
                                                        <div style={{
                                                            position: 'absolute', top: COLUMN_PADDING_TOP, left: '50%',
                                                            transform: 'translateX(-50%)', width: 'calc(100% - 24px)',
                                                            height: HEADER_HEIGHT - 8, background: style.headerBg,
                                                            borderRadius: 6, display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', flexDirection: 'column', gap: 2,
                                                        }}>
                                                            <span style={{ fontSize: 14, fontWeight: 700, color: style.headerText }}>{g}학년</span>
                                                            <div style={{ display: 'flex', gap: SEMESTER_GAP, marginTop: 1 }}>
                                                                {[1, 2].map(s => (
                                                                    <span key={s} style={{ fontSize: 9, fontWeight: 600, color: style.headerText, opacity: 0.75, width: SEMESTER_COL_WIDTH - 10, textAlign: 'center' }}>
                                                                        {s}학기
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* 드래그 모드: row 가이드라인 표시 */}
                                                        {isDragMode && Array.from({ length: MAX_ROWS }).map((_, rowIdx) => {
                                                            const rowY = COLUMN_PADDING_TOP + HEADER_HEIGHT + 16 + rowIdx * ROW_HEIGHT;
                                                            if (rowY + ROW_HEIGHT > layout.columnHeight) return null;
                                                            return (
                                                                <div key={rowIdx} style={{
                                                                    position: 'absolute', left: 8, right: 8, top: rowY,
                                                                    height: CARD_HEIGHT, borderRadius: 4,
                                                                    background: 'rgba(165, 180, 252, 0.05)',
                                                                    border: '1px dashed rgba(165, 180, 252, 0.2)',
                                                                    pointerEvents: 'none',
                                                                }} />
                                                            );
                                                        })}

                                                        <div style={{
                                                            position: 'absolute', left: '50%', top: COLUMN_PADDING_TOP + HEADER_HEIGHT + 4,
                                                            bottom: COLUMN_PADDING_BOTTOM, width: 0,
                                                            borderLeft: '1px dashed rgba(148, 163, 184, 0.4)',
                                                            transform: 'translateX(-50%)',
                                                        }} />
                                                    </div>
                                                );
                                            })}

                                            {/* SVG 연결선 */}
                                            <svg style={{
                                                position: 'absolute', top: 0, left: 0,
                                                width: layout.canvasWidth, height: layout.canvasHeight,
                                                pointerEvents: 'none', zIndex: 1,
                                                opacity: isDragMode ? 0.35 : 1,
                                                transition: 'opacity 0.2s',
                                            }}>
                                                <defs>
                                                    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                                                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                                                    </marker>
                                                    <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
                                                    </marker>
                                                </defs>
                                                {visibleEdges.map(([pre, post], idx) => {
                                                    const fromPos = layout.positions[pre];
                                                    const toPos = layout.positions[post];
                                                    if (!fromPos || !toPos) return null;
                                                    const isActive = selectedCourse && (selectedCourse.id === pre || selectedCourse.id === post);
                                                    const isDimmed = selectedCourse && !isActive;
                                                    return (
                                                        <path
                                                            key={idx}
                                                            d={makeOrthogonalPath(fromPos, toPos, pre, post, layout.positions)}
                                                            fill="none"
                                                            stroke={isActive ? '#4f46e5' : '#94a3b8'}
                                                            strokeWidth={isActive ? 2 : 1.2}
                                                            opacity={isDimmed ? 0.1 : (isActive ? 1 : 0.55)}
                                                            markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                                                            style={{ transition: 'all 0.2s ease' }}
                                                        />
                                                    );
                                                })}
                                            </svg>

                                            {/* 과목 카드 */}
                                            {visibleCourses.map((course) => {
                                                const pos = layout.positions[course.id];
                                                if (!pos) return null;
                                                const isSelected = selectedCourse?.id === course.id;
                                                const isRelated = related.has(course.id);
                                                const isDimmed = selectedCourse && !isSelected && !isRelated;
                                                const isDraggingThis = dragging?.course?.id === course.id;

                                                return (
                                                    <CourseCard
                                                        key={course.id}
                                                        course={course}
                                                        position={pos}
                                                        onClick={handleCardClick}
                                                        selected={isSelected}
                                                        related={isRelated}
                                                        dimmed={isDimmed}
                                                        isDragMode={isDragMode}
                                                        onDragStart={handleDragStart}
                                                        isDragging={isDraggingThis}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 줌 컨트롤 */}
                        <div style={{
                            position: 'absolute', bottom: 16, left: 16,
                            display: 'flex', flexDirection: 'column', gap: 0,
                            background: 'white', border: '1px solid #e2e8f0',
                            borderRadius: 8, boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                            overflow: 'hidden',
                        }}>
                            {[
                                { icon: <Plus size={14} />, onClick: () => { setAutoFit(false); setZoom(z => Math.min(2, (autoFit ? fitZoom : z) + 0.1)); }, title: '확대' },
                            ].map(({ icon, onClick, title }) => (
                                <button key={title} onClick={onClick} title={title} style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>{icon}</button>
                            ))}
                            <div style={{ padding: '2px 4px', fontSize: 10, textAlign: 'center', color: '#94a3b8', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
                                {Math.round(effectiveZoom * 100)}%
                            </div>
                            <button onClick={() => { setAutoFit(false); setZoom(z => Math.max(0.3, (autoFit ? fitZoom : z) - 0.1)); }} title="축소" style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                                <Minus size={14} />
                            </button>
                            <button onClick={() => setAutoFit(true)} title="화면에 맞춤" style={{ width: 32, height: 32, border: 'none', background: autoFit ? '#eef2ff' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: autoFit ? '#4f46e5' : '#475569', borderTop: '1px solid #f1f5f9' }}>
                                <Maximize2 size={12} />
                            </button>
                        </div>

                        {/* 범례 */}
                        <div style={{
                            position: 'absolute', bottom: 16, right: 16,
                            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
                            border: '1px solid #e2e8f0', borderRadius: 8,
                            boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                            padding: '8px 12px',
                        }}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>범례</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {tracks.map(t => (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.dot.includes('slate') ? '#64748b' : t.dot.includes('emerald') ? '#10b981' : '#6366f1' }} />
                                        <span style={{ fontSize: 11, color: '#475569' }}>{t.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 우측 상세 패널 */}
                    <aside style={{
                        width: 256, background: 'white', border: '1px solid #e2e8f0',
                        borderRadius: 12, overflowY: 'auto', flexShrink: 0,
                        opacity: isDragMode ? 0.5 : 1, transition: 'opacity 0.2s',
                        pointerEvents: isDragMode ? 'none' : 'auto',
                    }}>
                        <DetailPanel
                            course={selectedCourse}
                            onClose={() => setSelectedCourse(null)}
                            allCourses={courses}
                            edges={prerequisites}
                            onSelectCourse={setSelectedCourse}
                        />
                    </aside>
                </div>
            </div>

            {/* 드래그 고스트 카드 (fixed, 전역 위치) */}
            {dragging && (
                <GhostCard
                    course={dragging.course}
                    x={dragging.currentX - dragOffsetRef.current.x}
                    y={dragging.currentY - dragOffsetRef.current.y}
                    width={CARD_WIDTH * effectiveZoom}
                />
            )}
        </div>
    );
}

export default MainPage;