import { ChatBody } from '@/types/types';
import { streamChatWithProvider } from '@/utils/chatStream';

export const runtime = 'nodejs';

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const inputCode = url.searchParams.get('inputCode') || '';
    const model = url.searchParams.get('model') || '';
    const apiKey = url.searchParams.get('apiKey') || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const provider = url.searchParams.get('provider') || 'openai';
    // If you need extra params, extract them here
    const stream = await streamChatWithProvider(provider, inputCode, model, apiKey, {});
    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { inputCode, model, apiKey, provider = 'openai', ...extra } = (await req.json()) as ChatBody & { provider?: string };
    let apiKeyFinal = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const stream = await streamChatWithProvider(provider, inputCode, model, apiKeyFinal, extra);
    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
}
