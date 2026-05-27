function QuestionForm({ canAsk, onQuestionChange, onSubmit, question, status }) {
  return (
    <form className="question-form" onSubmit={onSubmit}>
      <input
        aria-label="상담 질문"
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
      />
      <button type="submit" disabled={!canAsk}>
        {status === 'loading' ? '질문 중' : '질문하기'}
      </button>
    </form>
  )
}

export default QuestionForm
