function QuestionForm({ canAsk, onQuestionChange, onSubmit, question, status }) {
  return (
    <form className="question-form" onSubmit={onSubmit}>
      <input
        aria-label="상담 질문"
        placeholder="예: 2학년 1학기 전에 들어야 할 선수과목을 알려줘"
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
      />
      <button type="submit" disabled={!canAsk}>
        {status === 'loading' ? '질문 중...' : '질문하기'}
      </button>
    </form>
  )
}

export default QuestionForm
