import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, BookOpen, Settings, Users, X, GitBranch, ChevronRight, Info, Layers, MessageCircle, Plus, Minus, Maximize2, LogOut } from 'lucide-react';

import { courseApi, prerequisiteApi } from './api.js';
const tracks = [
    { id: '공통', label: '공통', dot: 'bg-slate-500', text: 'text-slate-700', bg: 'bg-slate-50', cardBorder: '#cbd5e1' },
    { id: 'SW전공', label: 'SW전공', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', cardBorder: '#86efac' },
    { id: '컴공전공', label: '컴공전공', dot: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50', cardBorder: '#a5b4fc' },
];

// ===== 학년 칼럼 색상 (v2 톤) =====
const gradeStyle = {
    1: { bg: '#f5f5f7', headerBg: '#e8e8eb', headerText: '#475569' },
    2: { bg: '#e8f5e9', headerBg: '#c8e6c9', headerText: '#2e7d32' },
    3: { bg: '#fff8e1', headerBg: '#ffe082', headerText: '#f57f17' },
    4: { bg: '#f5f5f7', headerBg: '#e8e8eb', headerText: '#475569' },
};

// ===== 사진 기준 row 매핑 (요청사항 모두 반영) =====
// 변경 내역:
//  - 106(창의적공학설계) row 1 → 0  (= AI를 위한 이산수학과 같은 row)
//  - 107(객체지향응용) row 2 → 1
//  - 108(객체지향I) row 3 → 2
//  - 113(확률통계) row 1 → 0
//  - 114(선형대수) row 2 → 1
//  - 115(객체지향II) row 3 → 2
//  - 116(웹프로그래밍) row 4 → 3
//  - 105(AIoT프로그래밍) row 8 → 9
//  - 112(디지털논리회로) row 8 → 9
//  - 119(컴퓨터구조) row 8 → 9 (= 운영체제 127 row 9와 동일)
//  - 120(데이터통신) row 9 → 10 (컴퓨터네트워크 128 row 10과 동일)
//  - 131(산학협력캡스톤I) → 학기 변경(2학기로), row도 자연스럽게 위쪽 빈 자리에
//  - 132(ICT멘토링) → 학기 변경
const layoutOverride = {
    // 1학년 1학기
    101: { row: 0 },
    102: { row: 2 },
    // 1학년 2학기
    103: { row: 0 },
    104: { row: 3 },
    105: { row: 9 },
    // 2학년 1학기
    106: { row: 0 },
    107: { row: 1 },
    108: { row: 2 },
    109: { row: 5 },
    110: { row: 6 },
    111: { row: 7 },
    112: { row: 9 },
    // 2학년 2학기
    113: { row: 0 },
    114: { row: 1 },
    115: { row: 2 },
    116: { row: 3 },
    117: { row: 5 },
    118: { row: 7 },
    119: { row: 9 },
    120: { row: 10 },
    // 3학년 1학기
    121: { row: 2 },
    122: { row: 3 },
    123: { row: 4 },
    124: { row: 5 },
    125: { row: 7 },
    126: { row: 8 },
    127: { row: 9 },
    128: { row: 10 },
    129: { row: 11 },
    130: { row: 12 },
    // 3학년 2학기
    131: { row: 0 },   // 산학협력캡스톤I (2학기로 이동됨)
    132: { row: 1 },   // ICT멘토링 (2학기로 이동됨)
    133: { row: 5 },
    134: { row: 6 },
    135: { row: 7 },
    136: { row: 9 },
    137: { row: 10 },
    138: { row: 11 },
    // 4학년 1학기
    139: { row: 0 },
    140: { row: 1 },
    141: { row: 2 },
    142: { row: 5 },
    143: { row: 6 },
    144: { row: 7 },
    145: { row: 8 },
    146: { row: 9 },
    147: { row: 10 },
    148: { row: 11 },
    // 4학년 2학기
    149: { row: 0 },
    150: { row: 1 },
    151: { row: 4 },   // AI를 위한 인간과컴퓨터 상호작용 (모바일프로그래밍 row 4 와 같은 row)
    152: { row: 7 },
    153: { row: 9 },
    154: { row: 10 },
    155: { row: 11 },
};

// ===== 레이아웃 상수 =====
const COL_WIDTH = 320;             // 학년 칼럼 폭
const SEMESTER_COL_WIDTH = 150;    // 학기열 폭
const SEMESTER_GAP = 10;
const CARD_WIDTH = 150;            // 카드 폭
const CARD_HEIGHT = 72;            // 카드 높이 (3줄 + 학점 표시 여유)
const ROW_HEIGHT = 86;             // 행 높이 (카드 사이 간격 14px)
const HEADER_HEIGHT = 50;
const COLUMN_PADDING_TOP = 12;
const COLUMN_PADDING_BOTTOM = 16;
const PADDING_X = 24;
const PADDING_Y = 24;

// ===== 레이아웃 계산 =====
function computeLayout(visibleCourses) {
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
            // 1학기열 + gap + 2학기열 전체를 차지
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

// ===== 카드 회피 라우팅 =====
// path: 출발 카드 오른쪽 → 도착 카드 왼쪽으로 가되, 중간에 다른 카드를 만나면 위/아래로 우회
function makeOrthogonalPath(from, to, fromId, toId, allPositions) {
    const x1 = from.x + from.width;
    const y1 = from.y + from.height / 2;
    const x2 = to.x;
    const y2 = to.y + to.height / 2;

    // 같은 Y면 직선
    if (Math.abs(y1 - y2) < 1) {
        // 직선 경로 위에 다른 카드가 있는지 검사
        const blockingCard = findBlockingCard(x1, y1, x2, y2, fromId, toId, allPositions, true);
        if (!blockingCard) {
            return `M ${x1},${y1} L ${x2},${y2}`;
        }
        // 막혔으면 위/아래로 우회 (카드 위쪽으로 살짝 올렸다가 내려옴)
        const bypassY = blockingCard.y - 12;
        return roundedPath([
            [x1, y1],
            [x1 + 8, y1],
            [x1 + 8, bypassY],
            [x2 - 8, bypassY],
            [x2 - 8, y2],
            [x2, y2],
        ]);
    }

    // 일반적인 ㄷ자 경로: 수평 → 수직 → 수평
    // 중간 X 위치를 결정 (출발 카드와 도착 카드 사이)
    let midX = x1 + (x2 - x1) / 2;

    // midX 수직선에 다른 카드가 걸치는지 확인
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const verticalBlock = findVerticalBlock(midX, minY, maxY, fromId, toId, allPositions);
    if (verticalBlock) {
        // midX를 카드를 피하도록 옮김 (카드 우측으로)
        midX = verticalBlock.x + verticalBlock.width + 12;
        // 너무 멀어지면 오히려 도착 카드 직전으로
        if (midX > x2 - 10) {
            midX = x2 - 12;
        }
    }

    // 수평 경로 위 카드 검사
    const horizontalBlock1 = findBlockingCard(x1, y1, midX, y1, fromId, toId, allPositions, true);
    const horizontalBlock2 = findBlockingCard(midX, y2, x2, y2, fromId, toId, allPositions, true);

    if (horizontalBlock1 || horizontalBlock2) {
        // 수평 라인 자체가 카드를 가로지르면, 출발/도착에서 살짝 위/아래로 빠진 후 진행
        const offset1 = horizontalBlock1 ? (horizontalBlock1.y > y1 ? -12 : 12) : 0;
        const offset2 = horizontalBlock2 ? (horizontalBlock2.y > y2 ? -12 : 12) : 0;
        return roundedPath([
            [x1, y1],
            [x1 + 6, y1],
            [x1 + 6, y1 + offset1],
            [midX, y1 + offset1],
            [midX, y2 + offset2],
            [x2 - 6, y2 + offset2],
            [x2 - 6, y2],
            [x2, y2],
        ]);
    }

    return roundedPath([
        [x1, y1],
        [midX, y1],
        [midX, y2],
        [x2, y2],
    ]);
}

// 두 점 사이의 수평선 위에 카드(fromId, toId 제외)가 있는지 검사
function findBlockingCard(x1, y1, x2, y2, fromId, toId, allPositions, horizontalOnly) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (const [idStr, pos] of Object.entries(allPositions)) {
        const id = parseInt(idStr);
        if (id === fromId || id === toId) continue;
        const cardLeft = pos.x;
        const cardRight = pos.x + pos.width;
        const cardTop = pos.y;
        const cardBottom = pos.y + pos.height;

        // 수평선의 경우: y가 카드 범위 내에 있고 x 범위가 겹치는지
        if (horizontalOnly) {
            if (y1 >= cardTop - 2 && y1 <= cardBottom + 2 && cardLeft < maxX - 4 && cardRight > minX + 4) {
                return pos;
            }
        } else {
            // 사각 영역 충돌
            if (cardLeft < maxX && cardRight > minX && cardTop < maxY && cardBottom > minY) {
                return pos;
            }
        }
    }
    return null;
}

// 수직선이 카드를 가로지르는지 검사
function findVerticalBlock(x, minY, maxY, fromId, toId, allPositions) {
    for (const [idStr, pos] of Object.entries(allPositions)) {
        const id = parseInt(idStr);
        if (id === fromId || id === toId) continue;
        const cardLeft = pos.x;
        const cardRight = pos.x + pos.width;
        const cardTop = pos.y;
        const cardBottom = pos.y + pos.height;

        // x가 카드 가로 범위 안에 있고, 수직선의 y 범위가 카드 세로 범위와 겹침
        if (x >= cardLeft - 2 && x <= cardRight + 2 && cardBottom > minY && cardTop < maxY) {
            return pos;
        }
    }
    return null;
}

// 점들을 잇는 path를 만들되, 꺾이는 부분에 둥근 모서리 적용
function roundedPath(points) {
    if (points.length < 2) return '';
    const r = 5;
    let path = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 1; i < points.length - 1; i++) {
        const [px, py] = points[i - 1];
        const [cx, cy] = points[i];
        const [nx, ny] = points[i + 1];

        // 들어오는 방향과 나가는 방향
        const inDx = Math.sign(cx - px);
        const inDy = Math.sign(cy - py);
        const outDx = Math.sign(nx - cx);
        const outDy = Math.sign(ny - cy);

        // 코너 직전까지 직선
        const beforeX = cx - inDx * r;
        const beforeY = cy - inDy * r;
        // 코너 이후 시작
        const afterX = cx + outDx * r;
        const afterY = cy + outDy * r;

        path += ` L ${beforeX},${beforeY}`;
        // 같은 방향이면 그냥 통과 (꺾이지 않음)
        if (inDx === outDx && inDy === outDy) {
            path += ` L ${cx},${cy}`;
        } else {
            path += ` Q ${cx},${cy} ${afterX},${afterY}`;
        }
    }
    const last = points[points.length - 1];
    path += ` L ${last[0]},${last[1]}`;
    return path;
}

// ===== 카드 컴포넌트 =====
function CourseCard({ course, position, onClick, selected, dimmed, related }) {
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

    if (dimmed) {
        opacity = 0.3;
    }

    return (
        <div
            onClick={() => onClick(course)}
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
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
                if (!selected && !dimmed) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)';
                }
            }}
            onMouseLeave={(e) => {
                if (!selected && !dimmed) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadow;
                }
            }}
        >
            <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#0f172a',
                lineHeight: 1.25,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'keep-all',
                width: '100%',
            }}>
                {course.title}
            </div>
            <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>
                {course.credits}학점
            </div>
        </div>
    );
}

// ===== 상세 패널 =====
function DetailPanel({ course, onClose, allCourses, edges, onSelectCourse }) {
    if (!course) {
        return (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{
                    width: 56, height: 56, margin: '0 auto 16px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Info size={22} className="text-indigo-500" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">과목을 선택해주세요</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                    좌측 트리에서 과목을 클릭하면<br />
                    상세 정보와 선수관계가 표시됩니다
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
                <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md ${track.bg} ${track.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${track.dot}`}></span>
              {track.label}
          </span>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mb-1">{course.code}</p>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{course.title}</h3>
            </div>

            <div className="grid grid-cols-3 gap-px bg-slate-100">
                <div className="bg-white px-3 py-3 text-center">
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">학년</p>
                    <p className="text-sm font-bold text-slate-900 tabular-nums">{course.grade}학년</p>
                </div>
                <div className="bg-white px-3 py-3 text-center">
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">학기</p>
                    <p className="text-sm font-bold text-slate-900 tabular-nums">{course.semester}학기</p>
                </div>
                <div className="bg-white px-3 py-3 text-center">
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">학점</p>
                    <p className="text-sm font-bold text-slate-900 tabular-nums">{course.credits}</p>
                </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 rounded-full bg-amber-400"></div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">선수 과목</h4>
                    <span className="text-[10px] text-slate-400 tabular-nums">({prereqs.length})</span>
                </div>
                {prereqs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-3">선수 과목 없음</p>
                ) : (
                    <div className="space-y-1.5">
                        {prereqs.map(p => {
                            const t = tracks.find(tr => tr.id === p.category);
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => onSelectCourse(p)}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer group"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${t.dot} flex-shrink-0`}></span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-800 truncate">{p.title}</p>
                                        <p className="text-[10px] font-mono text-slate-400">{p.code} · {p.grade}학년 {p.semester}학기</p>
                                    </div>
                                    <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1 h-3.5 rounded-full bg-indigo-400"></div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">후속 과목</h4>
                    <span className="text-[10px] text-slate-400 tabular-nums">({nextCourses.length})</span>
                </div>
                {nextCourses.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-3">후속 과목 없음</p>
                ) : (
                    <div className="space-y-1.5">
                        {nextCourses.map(n => {
                            const t = tracks.find(tr => tr.id === n.category);
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => onSelectCourse(n)}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer group"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${t.dot} flex-shrink-0`}></span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-800 truncate">{n.title}</p>
                                        <p className="text-[10px] font-mono text-slate-400">{n.code} · {n.grade}학년 {n.semester}학기</p>
                                    </div>
                                    <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
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
    // 2. 백엔드 데이터 불러오기 (컴포넌트 마운트 시 실행)
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // API 호출
                const [courseData, preData] = await Promise.all([
                    courseApi.getAll(),
                    prerequisiteApi.getAll()
                ]);
                console.log('courses:', courseData);        // ← 추가
                console.log('prerequisites:', preData);     // ← 추가

                setCourses(courseData);
                // 선수관계를 [preId, postId] 형태의 2차원 배열로 변환 (기존 로직 호환용)
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
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
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
    }, [search, gradeFilters, trackFilters]);

    const layout = useMemo(() => computeLayout(visibleCourses), [visibleCourses]);

    // 자동 fit zoom 계산 (가로/세로 둘 다 들어가도록)
    const fitZoom = useMemo(() => {
        if (!containerSize.width || !containerSize.height || !layout.canvasWidth || !layout.canvasHeight) {
            return 1;
        }
        const zoomX = (containerSize.width - 16) / layout.canvasWidth;
        const zoomY = (containerSize.height - 16) / layout.canvasHeight;
        const fit = Math.min(zoomX, zoomY, 1.2); // 최대 1.2배까지만 확대 허용
        return Math.max(fit, 0.3);
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
    }, [selectedCourse]);

    // 같은 학년/학기 내 연결선은 표시 안 함
    const visibleEdges = useMemo(() => {
        const visibleIds = new Set(visibleCourses.map(c => c.id));
        const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));
        return prerequisites.filter(([a, b]) => {
            if (!visibleIds.has(a) || !visibleIds.has(b)) return false;
            const ca = courseMap[a];
            const cb = courseMap[b];
            if (ca.grade === cb.grade && ca.semester === cb.semester) return false;
            return true;
        });
    }, [visibleCourses]);

    const handleCardClick = (course) => {
        setSelectedCourse(prev => prev?.id === course.id ? null : course);
    };

    const resetFilters = () => {
        setSearch('');
        setGradeFilters({ 1: true, 2: true, 3: true, 4: true });
        setTrackFilters({ '공통': true, 'SW전공': true, '컴공전공': true });
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
                            <p className="text-xs text-slate-500 leading-tight">컴퓨터공학부 교과과정 이수 체계도</p>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-md border border-indigo-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                            <span className="text-xs font-medium text-indigo-700">관리자 계정</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="px-4 py-4">
                <div className="flex gap-3" style={{ height: 'calc(100vh - 96px)' }}>

                    {/* 좌측 패널 */}
                    <aside className="w-56 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden flex-shrink-0">
                        <div className="p-4 border-b border-slate-100">
                            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Search size={12} />
                                검색
                            </h2>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="과목명 검색..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-b border-slate-100 flex-1 overflow-y-auto">
                            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Layers size={12} />
                                학년
                            </h2>
                            <div className="space-y-1.5 mb-5">
                                {[1, 2, 3, 4].map((g) => (
                                    <label key={g} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={gradeFilters[g]}
                                            onChange={(e) => setGradeFilters({ ...gradeFilters, [g]: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 focus:ring-2 cursor-pointer"
                                        />
                                        <span className="text-sm text-slate-700">{g}학년</span>
                                        <span className="ml-auto text-[10px] text-slate-400 tabular-nums">
                      {courses.filter(c => c.grade === g).length}
                    </span>
                                    </label>
                                ))}
                            </div>

                            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <BookOpen size={12} />
                                트랙
                            </h2>
                            <div className="space-y-1.5">
                                {tracks.map((t) => (
                                    <label key={t.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={trackFilters[t.id]}
                                            onChange={(e) => setTrackFilters({ ...trackFilters, [t.id]: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 focus:ring-2 cursor-pointer"
                                        />
                                        <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`}></span>
                                        <span className="text-sm text-slate-700">{t.label}</span>
                                        <span className="ml-auto text-[10px] text-slate-400 tabular-nums">
                      {courses.filter(c => c.category === t.id).length}
                    </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 border-t border-slate-100 space-y-2">
                            <button
                                onClick={resetFilters}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                필터 초기화
                            </button>
                            <button className="w-full px-3 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-md transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                <MessageCircle size={13} />
                                AI 상담
                            </button>

                            {/* 관리자 전용 버튼 */}
                            {isAdmin && (
                                <>
                                    <div className="pt-2 mt-1 border-t border-slate-100"></div>
                                    <button
                                        onClick={onSwitchToAdmin}
                                        className="w-full px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Settings size={13} />
                                        관리자 대시보드 전환
                                    </button>
                                    <button
                                        onClick={onLogout}
                                        className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <LogOut size={12} />
                                        로그아웃
                                    </button>
                                </>
                            )}
                        </div>
                    </aside>

                    {/* 중앙 캔버스 */}
                    <section className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden relative flex flex-col min-w-0">
                        <div ref={canvasContainerRef} className="flex-1 overflow-hidden bg-slate-50/30 relative">
                            {visibleCourses.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                            <Search size={22} className="text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 mb-1">표시할 과목이 없습니다</p>
                                        <p className="text-xs text-slate-500">필터를 조정하거나 검색어를 변경해보세요</p>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        width: layout.canvasWidth * effectiveZoom,
                                        height: layout.canvasHeight * effectiveZoom,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: layout.canvasWidth,
                                            height: layout.canvasHeight,
                                            transform: `scale(${effectiveZoom})`,
                                            transformOrigin: '0 0',
                                        }}
                                    >
                                        {/* 학년 칼럼 (배경 + 헤더 통합) - v2 디자인 복귀 */}
                                        {[1, 2, 3, 4].map((g, i) => {
                                            const left = PADDING_X + i * COL_WIDTH;
                                            const top = PADDING_Y;
                                            const style = gradeStyle[g];
                                            return (
                                                <div
                                                    key={g}
                                                    style={{
                                                        position: 'absolute',
                                                        left,
                                                        top,
                                                        width: COL_WIDTH,
                                                        height: layout.columnHeight,
                                                        background: style.bg,
                                                        border: '1px dashed #cbd5e1',
                                                        borderRadius: 8,
                                                        zIndex: 0,
                                                    }}
                                                >
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: COLUMN_PADDING_TOP,
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        width: 'calc(100% - 24px)',
                                                        height: HEADER_HEIGHT - 8,
                                                        background: style.headerBg,
                                                        borderRadius: 6,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexDirection: 'column',
                                                        gap: 2,
                                                    }}>
                            <span style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: style.headerText,
                                fontVariantNumeric: 'tabular-nums',
                            }}>
                              {g}학년
                            </span>
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: SEMESTER_GAP,
                                                            marginTop: 1,
                                                        }}>
                              <span style={{
                                  fontSize: 9,
                                  fontWeight: 600,
                                  color: style.headerText,
                                  opacity: 0.75,
                                  width: SEMESTER_COL_WIDTH - 10,
                                  textAlign: 'center',
                              }}>
                                1학기
                              </span>
                                                            <span style={{
                                                                fontSize: 9,
                                                                fontWeight: 600,
                                                                color: style.headerText,
                                                                opacity: 0.75,
                                                                width: SEMESTER_COL_WIDTH - 10,
                                                                textAlign: 'center',
                                                            }}>
                                2학기
                              </span>
                                                        </div>
                                                    </div>

                                                    {/* 학기 구분 점선 */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: '50%',
                                                        top: COLUMN_PADDING_TOP + HEADER_HEIGHT + 4,
                                                        bottom: COLUMN_PADDING_BOTTOM,
                                                        width: 0,
                                                        borderLeft: '1px dashed rgba(148, 163, 184, 0.4)',
                                                        transform: 'translateX(-50%)',
                                                    }} />
                                                </div>
                                            );
                                        })}

                                        {/* SVG 연결선 (카드 회피 라우팅) */}
                                        <svg
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: layout.canvasWidth,
                                                height: layout.canvasHeight,
                                                pointerEvents: 'none',
                                                zIndex: 1,
                                            }}
                                        >
                                            <defs>
                                                <marker
                                                    id="arrow"
                                                    viewBox="0 0 10 10"
                                                    refX="9"
                                                    refY="5"
                                                    markerWidth="5"
                                                    markerHeight="5"
                                                    orient="auto-start-reverse"
                                                >
                                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                                                </marker>
                                                <marker
                                                    id="arrow-active"
                                                    viewBox="0 0 10 10"
                                                    refX="9"
                                                    refY="5"
                                                    markerWidth="6"
                                                    markerHeight="6"
                                                    orient="auto-start-reverse"
                                                >
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

                                            return (
                                                <CourseCard
                                                    key={course.id}
                                                    course={course}
                                                    position={pos}
                                                    onClick={handleCardClick}
                                                    selected={isSelected}
                                                    related={isRelated}
                                                    dimmed={isDimmed}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 줌 컨트롤 */}
                        <div className="absolute bottom-4 left-4 flex flex-col gap-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            <button
                                onClick={() => { setAutoFit(false); setZoom(z => Math.min(2, (autoFit ? fitZoom : z) + 0.1)); }}
                                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                                title="확대"
                            >
                                <Plus size={14} />
                            </button>
                            <div className="px-1 py-0.5 text-[10px] text-center text-slate-500 tabular-nums border-y border-slate-100 bg-slate-50">
                                {Math.round(effectiveZoom * 100)}%
                            </div>
                            <button
                                onClick={() => { setAutoFit(false); setZoom(z => Math.max(0.3, (autoFit ? fitZoom : z) - 0.1)); }}
                                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                                title="축소"
                            >
                                <Minus size={14} />
                            </button>
                            <button
                                onClick={() => setAutoFit(true)}
                                className={`w-8 h-8 flex items-center justify-center transition-colors border-t border-slate-100 ${autoFit ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                title="화면에 맞춤"
                            >
                                <Maximize2 size={12} />
                            </button>
                        </div>

                        {/* 범례 */}
                        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm px-3 py-2.5">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">범례</p>
                            <div className="flex items-center gap-3">
                                {tracks.map(t => (
                                    <div key={t.id} className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${t.dot}`}></span>
                                        <span className="text-[11px] text-slate-600">{t.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 우측 상세 패널 */}
                    <aside className="w-64 bg-white border border-slate-200 rounded-xl overflow-y-auto flex-shrink-0">
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
        </div>
    );
}


export default MainPage;
