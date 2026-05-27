const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    let message = '요청을 처리하지 못했습니다.'
    try {
      const body = await response.json()
      message = body.message || body.error || message
    } catch {
      message = response.status === 401 ? '요청 권한을 확인해 주세요.' : message
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const startChatSession = () =>
  request('/api/v1/chat/sessions/start', {
    method: 'POST',
  })

export const deleteChatSession = (sessionId) =>
  request(`/api/v1/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  })

export const askChatQuestion = ({ sessionId, question }) =>
  request('/api/v1/chat/sessions/ask', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      question,
    }),
  })
