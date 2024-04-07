import "dotenv/config";
import OpenAI from "openai";
import { trainingSample } from ".";

const baseOverride = process.env["OPENAI_API_BASE"];
const baseURL = baseOverride || null;
export const openai = new OpenAI({ baseURL });

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

  const lines = pieces.join('').split("\n").map(line => line.trim());
  const computationLines = sample.output.split("\n");

  console.log(`\n\nVs real:\n${sample.output}`);
  console.log(
    `\nExact computation match?
(Note: this may not match even if the model is correct since rule application order is undefined.)
${sample.output === lines.join("\n")}
`,
  );
  console.log(
    "Answer match?\n",
    computationLines[computationLines.length - 1] === lines[lines.length - 1]
  );
}

run();
