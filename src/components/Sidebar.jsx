function Sidebar({ onStartSession }) {
  return (
    <aside className="sidebar" aria-label="상담 메뉴">
      <button className="new-chat" type="button" onClick={onStartSession}>
        새 상담 시작
      </button>
      <div className="sidebar-note">
        <strong>상담 기준</strong>
        <span>학년, 전공, 선수과목을 함께 입력하면 더 정확하게 답변합니다.</span>
      </div>
    </aside>
  )
}

export default Sidebar
