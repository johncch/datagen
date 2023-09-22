export function createQueryBuilder(role, format, prompt) {

  function formSystemPrompt(role, format) {
    let initialContent = "";
    if (role) {
      initialContent += `${role}\n`
    }
    if (format) {
      initialContent += `${format}\n`
    }
    return initialContent;
  }

  const messages = [
    {
      role: "system",
      content: formSystemPrompt(role, format),
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
