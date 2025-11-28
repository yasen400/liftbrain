import OpenAI from 'openai';
import { ZodSchema } from 'zod';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set. AI features will be disabled.');
}

const openai = apiKey
  ? new OpenAI({ apiKey })
  : null;

type CompletionArgs<T> = {
  prompt: string;
  schema: ZodSchema<T>;
  model?: string;
};

type ResponsesCreateParams = Parameters<OpenAI['responses']['create']>[0];

export async function callOpenAI<T>({ prompt, schema, model }: CompletionArgs<T>): Promise<T> {
  if (!openai) {
    throw new Error('OpenAI client not configured. Set OPENAI_API_KEY.');
  }

  const payload = {
    model: model ?? process.env.AI_MODEL ?? 'gpt-4.1-mini',
    input: prompt,
    temperature: 0.3,
    max_output_tokens: 1800,
    response_format: { type: 'json_object' },
  } as ResponsesCreateParams;

  const response = await openai.responses.create(payload);

  if (!('output' in response)) {
    throw new Error('Received streaming response from OpenAI but streaming is not supported.');
  }

  const firstOutput = response.output?.[0];
  if (!firstOutput || !('content' in firstOutput) || !Array.isArray(firstOutput.content)) {
    throw new Error('OpenAI response missing structured content.');
  }

  const raw = firstOutput.content[0];
  const text = raw && 'text' in raw ? raw.text : JSON.stringify(firstOutput.content);
  if (!text) {
    throw new Error('OpenAI response missing text payload.');
  }
  return schema.parse(JSON.parse(text));
}
