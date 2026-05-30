export const initialEdges = [
    {
        id: 'e1-3',
        source: 'course-1', // 선수 과목 ID
        target: 'course-3', // 후수 과목 ID
        type: 'smoothstep',
        animated: true,      // 선이 움직이는 효과 (필요시)
        markerEnd: { type: MarkerType.ArrowClosed }
    },
];