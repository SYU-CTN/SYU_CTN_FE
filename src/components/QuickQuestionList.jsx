function QuickQuestionList({ questions, onSelectQuestion }) {
  return (
    <div className="quick-list" aria-label="빠른 질문">
      {questions.map((item) => (
        <button key={item} type="button" onClick={() => onSelectQuestion(item)}>
          {item}
        </button>
      ))}
    </div>
  )
}

export default QuickQuestionList
