import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI();

function createOpenAIEngine() {

  const model = "gpt-3.5-turbo"

  async function execute(builder) {
    const promise = new Promise(async (resolve, reject) => {
      const messages = builder.getMessages();
      const chat_completion = await openai.chat.completions.create(
        {
          model,
          messages
        }
      );

      const reply =
        chat_completion.choices[0].message?.content ?? "{ error: 'no reply' }";
      builder.addMessage("assistant", reply);
      resolve(builder);
    })
    return promise
  }

  return {
    execute,
  }
}

export const OpenAIEngine = createOpenAIEngine();
