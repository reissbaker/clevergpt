import "dotenv/config";
import tmp from "tmp";
import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";
import OpenAI from "openai";
import { trainingSample } from ".";
tmp.setGracefulCleanup();

export const openai = new OpenAI({});

const SAMPLES = 200;

async function createFinetune(
  filename: string,
  trainingData: string,
  validationData: string,
  hyperparameters: { epochs?: number, learningRateMultiplier?: number } = {}
) {
  console.log("Creating temp file...");
  const dir = await new Promise<string>((resolve, reject) => {
    tmp.dir((err, path) => {
      if(err) reject(err);
      else resolve(path);
    });
  });

  const basename = `${filename}-train.jsonl`;
  const filepath = path.join(dir, basename);
  await fs.writeFile(filepath, trainingData);
  const valBasename = `${filename}-val.jsonl`;
  const valFilepath = path.join(dir, valBasename);
  await fs.writeFile(valFilepath, validationData);

  console.log("Uploading...");
  const file = await openai.files.create({
    file: createReadStream(filepath),
    purpose: "fine-tune",
  });
  const valFile = await openai.files.create({
    file: createReadStream(valFilepath),
    purpose: "fine-tune",
  });

  await waitForUpload('training', file.id);
  await waitForUpload('validation', valFile.id);

  const job = await openai.fineTuning.jobs.create({
    training_file: file.id,
    validation_file: valFile.id,
    model: "gpt-3.5-turbo-0125",
    hyperparameters: {
      n_epochs: hyperparameters.epochs,
      learning_rate_multiplier: hyperparameters.learningRateMultiplier,
    },
  });
  console.log("Finetuning job created:");
  console.log(`https://platform.openai.com/finetune/${job.id}?filter=all`);
}

async function waitForUpload(logType: string, id: string) {
  console.log(`Checking if ${logType} data uploaded...`);
  while(true) {
    const retrieved = await openai.files.retrieve(id);
    if(retrieved.status === 'processed') break;
    console.log("Not yet processed...");
    await new Promise<void>(resolve => {
      setTimeout(resolve, 1000);
    });
  }
  console.log(`Uploaded ${logType} data`);
}

type Message = {
  role: 'user' | 'assistant',
  content: string,
};

function prepareSample(sample: { prompt: string, output: string }): Message[] {
  return [
    { role: 'user', content: sample.prompt },
    { role: 'assistant', content: sample.output },
  ];
}

const validation: Message[][] = [];
const training: Message[][] = [];
for(let i = 0; i < SAMPLES; i++) {
  validation.push(prepareSample(trainingSample()));
  training.push(prepareSample(trainingSample()));
}

createFinetune(
  "clevergpt",
  training.map(sample => JSON.stringify({ messages: sample })).join('\n'),
  validation.map(sample => JSON.stringify({ messages: sample })).join('\n'),
);
