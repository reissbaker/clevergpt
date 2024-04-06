import "dotenv/config";
import OpenAI from "openai";
import { trainingSample } from ".";

export const openai = new OpenAI({});

const sample = trainingSample();

async function run() {
  console.log(sample.prompt);
  const stream = await openai.chat.completions.create({
    model: process.env.MODEL_NAME!,
    temperature: 0,
    messages: [
      { role: 'user', content: sample.prompt },
    ],
    stream: true,
  });

  const pieces: string[] = [];

  for await(const chunk of stream) {
    const curr = chunk.choices[0].delta.content || '';
    process.stdout.write(curr);
    pieces.push(curr);
  }

  console.log("\n\nVs real:", sample.output);
  console.log("Match?", sample.output === pieces.join(''));
}

run();
