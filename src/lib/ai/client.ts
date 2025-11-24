import OpenAI from 'openai';
import { ZodSchema } from 'zod';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set. AI features will be disabled.');
}

const openai = apiKey
  ? new OpenAI({ apiKey })
  : null;

type CompletionArgs = {
  prompt: string;
  schema: ZodSchema;
  model?: string;
};

export async function callOpenAI<T>({ prompt, schema, model }: CompletionArgs): Promise<T> {
  if (!openai) {
    throw new Error('OpenAI client not configured. Set OPENAI_API_KEY.');
  }

  const response = await openai.responses.create({
    model: model ?? process.env.AI_MODEL ?? 'gpt-4.1-mini',
    input: prompt,
    temperature: 0.3,
    max_output_tokens: 1800,
    response_format: { type: 'json_object' },
  });

  const raw = response.output?.[0]?.content?.[0];
  const text = raw && 'text' in raw ? raw.text : JSON.stringify(response.output);
  if (!text) {
    throw new Error('OpenAI response missing text payload.');
  }
  return schema.parse(JSON.parse(text));
}
