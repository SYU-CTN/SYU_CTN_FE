function MessageList({ messages }) {
  return (
    <div className="messages" aria-live="polite">
      {messages.map((message, index) => (
        <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
          <strong>{message.role === 'student' ? '학생' : 'AI 상담봇'}</strong>
          <p>{message.text}</p>
        </article>
      ))}

      <article className="tip">
        <strong>맞춤 추천 팁</strong>
        <p>학년/전공/이수과목을 입력하면 다음 학기 추천 로드맵을 자동으로 계산해드려요.</p>
      </article>
    </div>
  )
}

export default MessageList
