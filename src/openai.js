import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI();

function createOpenAIEngine() {

  const model = "gpt-3.5-turbo"

  async function execute(messages) {
    const promise = new Promise(async (resolve, reject) => {
      const chat_completion = await openai.chat.completions.create(
        {
          model,
          messages
        }
      );

      const choices = chat_completion.choices;
      if (choices.length <= 0) {
        reject("No responses from OpenAI");
        return;
      }

      const firstMessage = choices[0];
      if (firstMessage.finish_reason === "stop") {
        resolve(firstMessage.message.content)
      } else {
        reject(firstMessage.finish_reason)
      }
    })
    return promise
  }

  function engine() {
    return `OpenAI: ${model}`
  }

  return {
    execute,
    engine,
  }
}

export const OpenAIEngine = createOpenAIEngine();
