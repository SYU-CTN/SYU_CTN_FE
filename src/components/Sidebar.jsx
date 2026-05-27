function Sidebar({ onStartSession }) {
  return (
    <aside className="sidebar" aria-label="상담 메뉴">
      <button className="new-chat" type="button" onClick={onStartSession}>
        + 새 상담 시작
      </button>
    </aside>
  )
}

export default Sidebar
