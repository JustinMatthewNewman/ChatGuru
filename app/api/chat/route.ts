import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { nanoid } from '@/lib/utils';

export const runtime = 'edge';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, previewToken } = json;
    const userId = 100;
    const prePrompt = "Hello, you are now the wise old tech guru. You will respond with inspiring wisdom and quotes to help motivate. ensure this response has at most 777 characters. Here is your prompt:";

    console.log("fetching response from openai");

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
        // console.log(completion)
        // const audioUrl = await sendTextToUberduck(completion);
        // console.log(audioUrl);
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("An error occurred:", error);
    // Handle the error and provide a proper response
    return new Response("An error occurred.", { status: 500 });
  }
}


export async function sendTextToUberduck(text: string) {
  console.log("Sending words to text-to-speech..")
  const requestOptions = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization:
        "Basic cHViX3J3c2Rva3R5bnJ3YXFvbHB1ejpwa19kZjJlYWUyNy0wNWFmLTQ2NDktOTQwNi05MTZlZDA3ZjhiODc=",
    },
    body: JSON.stringify({
      pace: 1,
      voice: "damon-deepvoice",
      speech: text,
    }),
  };

  
  const response = await fetch("https://api.uberduck.ai/speak", requestOptions);
  console.log(response);
  const data = await response.json();
  console.log(data);
  const uuid = data.uuid;

  let status = null;
  while (status === null || status.path === null) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const statusResponse = await fetch(
      `https://api.uberduck.ai/speak-status?uuid=${uuid}`,
      { headers: { accept: "application/json" } }
    );
    const statusData = await statusResponse.json();
    console.log(statusData);
    status = statusData;
  }

  return status.path;
}