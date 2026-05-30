// src/constants/initialElements.js
export const gradeGroups = [
    // 1. 배경 박스 (학년 영역)
    {
        id: 'grade',
        type: 'group',
        data: { label: '' }, // 룹 레이블은 비워둡니다.
        position: { x: 0, y: 0 },
        style: {
            width: 2500,
            height: 1200,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            border: '2px dashed #bbb',
            borderRadius: '12px'
        },
        draggable: false, // 배경이 움직이지 않게 고정 (관리자 모드 아닐 때)
    },

    // 2. 학년 표시 텍스트 (박스 왼쪽 상단에 고정된 노드)
    {
        id: 'grade-1-label',
        data: { label: '1학년' },
        position: { x: 0, y: 0 }, // 박스 내부 왼쪽 상단
        type: "group",
        style: {
            background: 'transparent',
            border: 'none',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#555',
            width: 550,
            height: 1200,
            backgroundColor: 'rgba(249, 250, 251,100)'
        },
        draggable: false,
    },
    {
        id:'grade-2-label',
        data: {label: '2학년'},
        position: {x: 600, y:0},
        type: "group",
        style: {
            background: 'transparent',
            border: 'none',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#555',
            width: 550,
            height: 1200,
            backgroundColor: 'rgba(209, 242, 219,18)'

        },
        draggable: false,
    },
    {
        id:'grade-3-label',
        data: {label: '3학년'},
        position: {x: 1200, y:0},
        type: "group",
        style: {
            background: 'transparent',
            border: 'none',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#555',
            width: 550,
            height: 1200,
            backgroundColor: 'rgba(255, 240, 191,18)'

        },
        draggable: false,
    },
    {
        id:'grade-4-label',
        data: {label: '4학년'},
        position: {x: 1800, y:0},
        type: "group",
        style: {
            background: 'transparent',
            border: 'none',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#555',
            width: 550,
            height: 1200,
            // backgroundColor: 'rgba(229, 209, 255, 18)'

        },
        draggable: false,
    },
    // 3. 실제 과목 노드
    // {
    //     id: 'course-1',
    //     data: { label: 'AI를 위한 미적분학' },
    //     position: { x: 50, y: 90 }, // 텍스트와 겹치지 않게 배치
    //     parentNode: 'grade-1-label',
    //     extent: 'parent',
    //     style: {
    //         fontSize: '11px',
    //         fontWeight: "bold",
    //     }
    // },
    {
        id: 'course-2',
        data: { label: '소프트웨어 원리' },
        position: { x: 50, y: 250 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-1-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-3',
        data: { label: 'AI를 위한 이산수학' },
        position: { x: 300, y: 90 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-1-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-4',
        data: { label: 'UX 프로그래밍' },
        position: { x: 300, y: 400 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-1-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-5',
        data: { label: 'AIoT 프로그래밍' },
        position: { x: 300, y: 800 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-1-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-6',
        data: { label: '창의적 공학 설계' },
        position: { x: 50, y: 90 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-7',
        data: { label: '객체지향프로그래밍응용' },
        position: { x: 50, y: 150 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-8',
        data: { label: '객체지향 프로그래밍I' },
        position: { x: 50, y: 250 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-9',
        data: { label: '컴퓨터 프로그래밍' },
        position: { x: 50, y: 450 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-10',
        data: { label: '컴퓨터프로그래밍응용' },
        position: { x: 50, y: 550 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-11',
        data: { label: '오픈소스SW이해와활용' },
        position: { x: 50, y: 650 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-12',
        data: { label: '디지털 논리회로' },
        position: { x: 50, y: 800 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-13',
        data: { label: '확률통계' },
        position: { x: 300, y: 90 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-14',
        data: { label: '선형대수' },
        position: { x: 300, y: 150 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-15',
        data: { label: '객체지향 프로그래밍II' },
        position: { x: 300, y: 250 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-16',
        data: { label: '웹프로그래밍' },
        position: { x: 300, y: 350 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-17',
        data: { label: '자료구조' },
        position: { x: 300, y: 450 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-18',
        data: { label: 'AI응용윈도우프로그래밍' },
        position: { x: 300, y: 650 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-19',
        data: { label: '컴퓨터구조' },
        position: { x: 300, y: 800 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-20',
        data: { label: '데이터통신' },
        position: { x: 300, y: 900 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-2-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-21',
        data: { label: '컴파일러' },
        position: { x: 50, y: 150 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-22',
        data: { label: '프로그래밍언어론' },
        position: { x: 50, y: 250 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-23',
        data: { label: '모바일 프로그래밍' },
        position: { x: 50, y: 350 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-24',
        data: { label: '컴퓨터알고리즘' },
        position: { x: 50, y: 450 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-25',
        data: { label: '데이터베이스' },
        position: { x: 50, y: 650 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-26',
        data: { label: '시스템프로그래밍' },
        position: { x: 50, y: 725 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-27',
        data: { label: '운영채제' },
        position: { x: 50, y: 800 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-28',
        data: { label: '컴퓨터네트워크' },
        position: { x: 50, y: 900 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-29',
        data: { label: '멀티미디어' },
        position: { x: 50, y: 1000 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-30',
        data: { label: 'Ai를위한클라우드컴퓨팅' },
        position: { x: 50, y: 1100 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-31',
        data: { label: '산학협력캡스톤디자인I' },
        position: { x: 300, y: 90 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-32',
        data: { label: 'ICT멘토링프로젝트' },
        position: { x: 300, y: 150 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-33',
        data: { label: '인공지능' },
        position: { x: 300, y: 450 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-34',
        data: { label: '소트프웨어공학' },
        position: { x: 300, y: 550 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-35',
        data: { label: '데이터베이스프로그래밍' },
        position: { x: 300, y: 650 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-36',
        data: { label: '리눅스시스템' },
        position: { x: 300, y: 800 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-37',
        data: { label: '네트워크프로그래밍' },
        position: { x: 300, y: 900 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-38',
        data: { label: '디지털영상처리' },
        position: { x: 300, y: 1000 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-3-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-39',
        data: { label: '산학협력캡스톤디자인II' },
        position: { x: 50, y: 90 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-40',
        data: { label: '종합시험(P)' },
        position: { x: 50, y: 200 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-41',
        data: { label: 'ICT인턴십(I,II,III,IV)' },
        position: { x: 50, y: 300 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            width: 450,
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-42',
        data: { label: '기계학습' },
        position: { x: 50, y: 450 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-43',
        data: { label: '소프트웨어 디자인 패턴' },
        position: { x: 50, y: 550 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-44',
        data: { label: 'AI를 위한 빅데이터 처리' },
        position: { x: 50, y: 650 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-45',
        data: { label: 'AI 임베디드시스템' },
        position: { x: 50, y: 725 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-46',
        data: { label: 'AIoT 프로그래밍II' },
        position: { x: 50, y: 800 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-47',
        data: { label: '모바일네트워크' },
        position: { x: 50, y: 900 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-48',
        data: { label: '컴퓨터그래픽스' },
        position: { x: 50, y: 1000 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-49',
        data: { label: '산학협력캡스톤디자인III' },
        position: { x: 350, y: 90 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-50',
        data: { label: '기업과 정신과 창업' },
        position: { x: 350, y: 200 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-51',
        data: { label: 'AI를 위한 인간과컴퓨터상호작용' },
        position: { x: 300, y: 350 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            width: 200,
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-52',
        data: { label: 'AI를 위한 빅데이터 분석 및 표현' },
        position: { x: 300, y: 650 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            width: 200,
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-53',
        data: { label: '실시간 운영채제' },
        position: { x: 350, y: 725 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-54',
        data: { label: '네트워크엔지니어링' },
        position: { x: 350, y: 900 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },
    {
        id: 'course-55',
        data: { label: '정보보호및보안' },
        position: { x: 350, y: 1000 }, // 텍스트와 겹치지 않게 배치
        parentNode: 'grade-4-label',
        extent: 'parent',
        style: {
            fontSize: '11px',
            fontWeight: "bold",
        }
    },



];
