import * as fs from "fs/promises";
import { generate } from ".";

const TRAINING_SAMPLES = 2500;
const EVAL_SAMPLES = 300;

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

const validation = generate(EVAL_SAMPLES, prepareSample);
const training = generate(TRAINING_SAMPLES, prepareSample);

async function write() {
  await fs.writeFile("data/training.jsonl", training.map(d => JSON.stringify(d)).join("\n"));
  await fs.writeFile("data/validation.jsonl", validation.map(d => JSON.stringify(d)).join("\n"));
}

write();
