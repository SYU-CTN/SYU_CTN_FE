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
        <p>학년, 전공, 이수한 과목을 함께 입력하면 다음 학기 추천 로드맵을 더 구체적으로 계산합니다.</p>
      </article>
    </div>
  )
}

export default MessageList
