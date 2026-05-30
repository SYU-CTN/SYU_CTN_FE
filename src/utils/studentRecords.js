import api from '../api';

const STORAGE_PREFIX = 'studentCourseRecords';

export const getCurrentLoginId = () => localStorage.getItem('loggedInId') || 'anonymous';

export const getStudentRecordsKey = (loginId = getCurrentLoginId()) => `${STORAGE_PREFIX}:${loginId}`;

export const loadStudentCourseRecords = (loginId = getCurrentLoginId()) => {
    try {
        const raw = localStorage.getItem(getStudentRecordsKey(loginId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveStudentCourseRecords = (records, loginId = getCurrentLoginId()) => {
    localStorage.setItem(getStudentRecordsKey(loginId), JSON.stringify(records));
};

export const getCourseRecordId = (course) => String(course?.id ?? course?.subjectId ?? course?.courseId ?? course?.courseCode ?? course?.code ?? '');

export const normalizeCourseToStudentRecord = (course) => {
    const id = getCourseRecordId(course);
    return {
        subjectId: id,
        courseId: id,
        subjectName: course?.subjectName || course?.title || '',
        courseCode: course?.courseCode || course?.code || '',
        credit: Number(course?.credit ?? course?.credits ?? 0),
        credits: Number(course?.credits ?? course?.credit ?? 0),
        gradeLevel: course?.gradeLevel ?? course?.grade ?? '',
        semester: course?.semester ?? '',
        category: course?.category || '',
        isRequired: course?.isRequired ?? course?.category === '공통',
        isCompleted: true,
        completedAt: course?.completedAt || new Date().toISOString(),
        score: course?.score || '',
    };
};

export const mergeCurriculumWithRecords = (curriculumList, records) => {
    const byId = new Map(records.map((record) => [String(record.subjectId), record]));
    const byCode = new Map(records.filter((record) => record.courseCode).map((record) => [record.courseCode, record]));
    const merged = curriculumList.map((subject) => {
        const id = String(subject.subjectId ?? subject.courseId ?? subject.id ?? '');
        const code = subject.courseCode || subject.code || '';
        const record = byId.get(id) || byCode.get(code);
        return record ? { ...subject, ...record, isCompleted: true } : subject;
    });

    const existingIds = new Set(merged.map((subject) => String(subject.subjectId ?? subject.courseId ?? subject.id ?? '')));
    const existingCodes = new Set(merged.map((subject) => subject.courseCode || subject.code || ''));
    records.forEach((record) => {
        if (!existingIds.has(String(record.subjectId)) && !existingCodes.has(record.courseCode || '')) {
            merged.push(record);
        }
    });

    return merged;
};

export const upsertCompletedCourseRecord = (course, loginId = getCurrentLoginId()) => {
    const records = loadStudentCourseRecords(loginId);
    const nextRecord = normalizeCourseToStudentRecord(course);
    const exists = records.some((record) => String(record.subjectId) === String(nextRecord.subjectId));

    if (exists) {
        const nextRecords = records.map((record) => (
            String(record.subjectId) === String(nextRecord.subjectId)
                ? { ...record, ...nextRecord, score: record.score || nextRecord.score }
                : record
        ));
        saveStudentCourseRecords(nextRecords, loginId);
        return { records: nextRecords, added: false };
    }

    const nextRecords = [...records, nextRecord];
    saveStudentCourseRecords(nextRecords, loginId);
    return { records: nextRecords, added: true };
};

export const updateCourseRecordScore = (subjectId, score, loginId = getCurrentLoginId()) => {
    const records = loadStudentCourseRecords(loginId);
    const nextRecords = records.map((record) => (
        String(record.subjectId) === String(subjectId) ? { ...record, score } : record
    ));
    saveStudentCourseRecords(nextRecords, loginId);
    return nextRecords;
};

const normalizeRecordsResponse = (data) => {
    const records = Array.isArray(data) ? data : (data?.records || data?.completedCourses || data?.data || []);
    return records.map((record) => ({
        subjectId: String(record.subjectId ?? record.courseId ?? record.id ?? ''),
        courseId: String(record.courseId ?? record.subjectId ?? record.id ?? ''),
        subjectName: record.subjectName || record.courseTitle || record.title || '',
        courseCode: record.courseCode || record.code || '',
        credit: Number(record.credit ?? record.credits ?? 0),
        credits: Number(record.credits ?? record.credit ?? 0),
        gradeLevel: record.gradeLevel ?? record.grade ?? '',
        semester: record.semester ?? '',
        category: record.category || '',
        isRequired: record.isRequired ?? false,
        isCompleted: record.isCompleted ?? true,
        completedAt: record.completedAt || '',
        score: record.score || record.gradeScore || record.letterGrade || '',
    }));
};

export const fetchStudentCourseRecords = async (loginId = getCurrentLoginId()) => {
    try {
        const response = await api.get(`/api/v1/students/${encodeURIComponent(loginId)}/completed-courses`);
        const records = normalizeRecordsResponse(response.data);
        saveStudentCourseRecords(records, loginId);
        return records;
    } catch (error) {
        console.error('수강이력 조회 API 실패, 로컬 데이터를 사용합니다:', error);
        return loadStudentCourseRecords(loginId);
    }
};

export const registerCompletedCourseRecord = async (course, loginId = getCurrentLoginId()) => {
    const localResult = upsertCompletedCourseRecord(course, loginId);
    const record = normalizeCourseToStudentRecord(course);

    try {
        await api.post(`/api/v1/students/${encodeURIComponent(loginId)}/completed-courses`, {
            courseId: record.courseId,
            subjectId: record.subjectId,
            courseCode: record.courseCode,
            subjectName: record.subjectName,
            credit: record.credit,
            gradeLevel: record.gradeLevel,
            semester: record.semester,
            category: record.category,
            completedAt: record.completedAt,
        });
        const records = await fetchStudentCourseRecords(loginId);
        return { records, added: localResult.added };
    } catch (error) {
        console.error('수강 완료 등록 API 실패, 로컬에만 저장합니다:', error);
        return localResult;
    }
};

export const saveCourseRecordScore = async (subjectId, score, loginId = getCurrentLoginId()) => {
    const localRecords = updateCourseRecordScore(subjectId, score, loginId);

    try {
        await api.patch(`/api/v1/students/${encodeURIComponent(loginId)}/completed-courses/${encodeURIComponent(subjectId)}/grade`, {
            score,
        });
        const records = await fetchStudentCourseRecords(loginId);
        return records;
    } catch (error) {
        console.error('성적 저장 API 실패, 로컬에만 저장합니다:', error);
        return localRecords;
    }
};
