export function createQueryBuilder(role, prompt) {

  const messages = [
    {
      role: "system",
      content: role,
    },
    {
      role: "user",
      content: prompt,
    },
  ]

  function addMessage(role = "user", msg) {
    messages.push({
      role,
      content: msg
    })
  }

  function getLast() {
    return messages[messages.length - 1]
  }

  function getMessages() {
    return messages
  }

  return {
    addMessage,
    getLast,
    getMessages,
  }
}
