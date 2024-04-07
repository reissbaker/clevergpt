import * as fs from "fs/promises";
import { generate } from ".";

const SAMPLES = 3000;

type Instruction = {
  instruction: string,
  output: string,
};

function prepareSample(sample: { prompt: string, output: string }): Instruction {
  return {
    instruction: sample.prompt,
    output: sample.output,
  };
}

const validation = generate(SAMPLES, prepareSample);
const training = generate(SAMPLES, prepareSample);

async function write() {
  await fs.writeFile("data/training.jsonl", training.map(d => JSON.stringify(d)).join("\n"));
  await fs.writeFile("data/validation.jsonl", validation.map(d => JSON.stringify(d)).join("\n"));
}

write();
