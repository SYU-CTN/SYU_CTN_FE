import React from 'react';

// 💡 로컬스토리지나 전역 상태에서 현재 로그인한 유저의 권한을 꺼내오는 함수
const getCurrentUserRole = () => {
    // 백엔드 세팅과 맞춰서 기본값은 'STUDENT'로 둡니다.
    // 로그인 시 백엔드가 준 role을 localStorage.setItem('user_role', 'ADMIN') 형태로 저장했다고 가정합니다.
    return localStorage.getItem('user_role') || 'STUDENT';
};

export default function HasRole({ allowedRoles, children }) {
    const currentRole = getCurrentUserRole();

    // 허용된 권한 목록(allowedRoles)에 현재 유저의 권한이 없으면 화면에 아무것도 안 보여줌(null)
    if (!allowedRoles.includes(currentRole)) {
        return null;
    }

    // 권한이 맞으면 감싸고 있는 자식 컴포넌트(버튼이나 패널)를 그대로 노출
    return <>{children}</>;
}