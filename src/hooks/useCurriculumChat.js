import { useState } from 'react'
import {
  askChatQuestion,
  deleteChatSession,
  startChatSession,
} from '../api/chatApi'

export const useCurriculumChat = () => {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('ready')
  const [error, setError] = useState('')

  const canAsk = question.trim().length > 0 && status !== 'loading'

  const startSession = async () => {
    setStatus('loading')
    setError('')

    try {
      const data = await startChatSession()
      setSessionId(data.sessionId)
      setMessages([])
      setStatus('ready')
    } catch (event) {
      setStatus('ready')
      setError(event.message)
    }
  }

  const discardSession = async () => {
    if (!sessionId) {
      setMessages([])
      return
    }

    setStatus('loading')
    setError('')

    try {
      await deleteChatSession(sessionId)
      setSessionId(null)
      setMessages([])
      setStatus('ready')
    } catch (event) {
      setStatus('ready')
      setError(event.message)
    }
  }

  const askQuestion = async (event) => {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) {
      return
    }

    setStatus('loading')
    setError('')
    setQuestion('')
    setMessages((current) => [
      ...current,
      { role: 'student', text: trimmedQuestion },
    ])

    try {
      let activeSessionId = sessionId
      if (!activeSessionId) {
        const startData = await startChatSession()
        activeSessionId = startData.sessionId
        setSessionId(activeSessionId)
      }

      const data = await askChatQuestion({
        sessionId: activeSessionId,
        question: trimmedQuestion,
      })

      setMessages((current) => [
        ...current,
        { role: 'assistant', text: data.answer },
      ])
      setStatus('ready')
    } catch (event) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: '백엔드 연결 중 문제가 발생했습니다. 서버 실행 상태를 확인해 주세요.',
        },
      ])
      setStatus('ready')
      setError(event.message)
    }
  }

  return {
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
  }
}
