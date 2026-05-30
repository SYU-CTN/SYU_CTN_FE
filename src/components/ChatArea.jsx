import MessageList from './MessageList'
import QuestionForm from './QuestionForm'
import QuickQuestionList from './QuickQuestionList'

function ChatArea({
  canAsk,
  error,
  messages,
  onDiscardSession,
  onQuestionChange,
  onQuestionSubmit,
  onSelectQuickQuestion,
  question,
  quickQuestions,
  sessionId,
  status,
}) {
  return (
    <section className="chat-area" aria-label="AI 상담">
      <div className="intro">
        <span>AI Curriculum Advisor</span>
        <h2>커리큘럼, 무엇이 궁금하신가요?</h2>
        <p>학년, 전공, 이수 과목을 기준으로 다음 학기 추천 경로를 안내합니다.</p>
      </div>

      <QuickQuestionList
        questions={quickQuestions}
        onSelectQuestion={onSelectQuickQuestion}
      />

      <MessageList messages={messages} />

      {error && <p className="error-message">{error}</p>}

      <QuestionForm
        canAsk={canAsk}
        onQuestionChange={onQuestionChange}
        onSubmit={onQuestionSubmit}
        question={question}
        status={status}
      />

      <div className="session-row">
        <button type="button" onClick={onDiscardSession}>
          상담 종료
        </button>
      </div>
    </section>
  )
}

export default ChatArea
