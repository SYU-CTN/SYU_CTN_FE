import ChatArea from '../components/ChatArea'
import AppHeader from '../components/AppHeader'
import Sidebar from '../components/Sidebar'
import { QUICK_QUESTIONS } from '../constants/chat'
import { useCurriculumChat } from '../hooks/useCurriculumChat'

function CurriculumChatPage() {
  const {
    canAsk,
    discardSession,
    error,
    messages,
    question,
    sessionId,
    setQuestion,
    startSession,
    status,
    askQuestion,
  } = useCurriculumChat()

  return (
    <main className="app-shell">
      <AppHeader />

      <div className="workspace">
        <Sidebar onStartSession={startSession} />

        <ChatArea
          canAsk={canAsk}
          error={error}
          messages={messages}
          onDiscardSession={discardSession}
          onQuestionChange={setQuestion}
          onQuestionSubmit={askQuestion}
          onSelectQuickQuestion={setQuestion}
          question={question}
          quickQuestions={QUICK_QUESTIONS}
          sessionId={sessionId}
          status={status}
        />
      </div>
    </main>
  )
}

export default CurriculumChatPage
