import endent from 'endent';

const createPrompt = (inputCode: string) => {
  const data = (inputCode: string) => {
    return endent`${inputCode}`;
  };
  if (inputCode) {
    return data(inputCode);
  }
};

export interface ChatProvider {
  name: string;
  streamChat: (
    inputCode: string,
    model: string,
    key: string | undefined,
    extra?: Record<string, any>
  ) => Promise<ReadableStream>;
}

export const providers: Record<string, ChatProvider> = {
  openai: {
    name: 'OpenAI',
    streamChat: async (inputCode, model, key) => {
      const prompt = createPrompt(inputCode);
      const system = { role: 'system', content: prompt };
      const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key || process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        method: 'POST',
        body: JSON.stringify({
          model,
          messages: [system],
          temperature: 0,
          stream: true,
        }),
      });
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      if (res.status !== 200) {
        const statusText = res.statusText;
        const result = await res.body?.getReader().read();
        throw new Error(
          `OpenAI API returned an error: ${
            decoder.decode(result?.value) || statusText
          }`,
        );
      }
      const { createParser } = await import('eventsource-parser');
      const stream = new ReadableStream({
        async start(controller) {
          const onParse = (event: any) => {
            if (event.type === 'event') {
              const data = event.data;
              if (data === '[DONE]') {
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(data);
                const text = json.choices[0].delta.content;
                const queue = encoder.encode(text);
                controller.enqueue(queue);
              } catch (e) {
                controller.error(e);
              }
            }
          };
          const parser = createParser(onParse);
          for await (const chunk of res.body as any) {
            parser.feed(decoder.decode(chunk));
          }
        },
      });
      return stream;
    },
  },
  // Add more providers here
};

export async function streamChatWithProvider(
  providerName: string,
  inputCode: string,
  model: string,
  key: string | undefined,
  extra?: Record<string, any>
): Promise<ReadableStream> {
  const provider = providers[providerName];
  if (!provider) throw new Error(`Provider ${providerName} not supported.`);
  return provider.streamChat(inputCode, model, key, extra);
}
