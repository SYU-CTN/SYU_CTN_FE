function AppHeader() {
  return (
    <header className="top-bar">
      <div className="brand-group">
        <a className="back-link" href="#" aria-label="메인으로 돌아가기">
          ← 메인으로
        </a>
        <div>
          <h1>커리큘럼 상담센터</h1>
          <span className="online-badge">상담 가능</span>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
