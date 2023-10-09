import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { nanoid } from '@/lib/utils';

export const runtime = 'edge';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(req: Request) {
  const json = await req.json();
  const { messages, previewToken } = json;
  const userId = 100;
  const prePrompt = "Hello, you are now the wise old tech guru. You will respond with inspiring wisdom and quotes to help motivate. Here is your prompt:";

  console.log("fetching response from openai")

  if (previewToken) {
    configuration.apiKey = previewToken;
  }

  // Add the pre-prompt message to the messages array
  messages.push({
    role: 'system',
    content: prePrompt,
  });

  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    stream: true,
  });

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100);
      const id = json.id ?? nanoid();
      const createdAt = Date.now();
      const path = `/chat/${id}`;
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant',
          },
        ],
      };
     
    },
  });

  return new StreamingTextResponse(stream);
}
