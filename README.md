# CleverGPT

Inspired by [Victor Taelin's
tweet](https://twitter.com/i/bookmarks/all?post_id=1776096481704804789)
about GPTs failing to be able to perform straightforward step-by-step
reduction for [interaction
nets](https://en.wikipedia.org/wiki/Interaction_nets), this repo finetunes
gpt-3.5-turbo or Mistral 7B with synthetic data to correctly perform
step-by-step reduction for interaction nets.

## How it works

Interaction nets similar to Taelin's tweet are pretty easy to generate: choose
a token length, and then randomly pick tokens up to the length. Here we
randomly choose up to 21 tokens; since that results in over 5 trillion possible
interaction nets, training on a small subset of the nets should put to rest the
idea that the model is just memorizing the output: if it's correctly solving a
large percentage of the nets, it must have learned to generally apply an
underlying pattern.

For gpt-3.5-turbo, we train on 2000 randomly generated nets, and use a
validation set also of 2000. 2k samples appears to be good enough to get very
close to perfect performance at any size in the training range; originally we
trained on 200 samples, which provided near-perfect performance on <10 token
nets but could sometimes struggle with ones approaching 21 tokens. 2000 samples
is still far below the 5 trillion valid 21-token inputs, so the model isn't
memorizing the outputs, it's just getting better at applying the pattern it's
learned.

For Mistral, we do the same except on 3k samples each. Fewer might work too, it
just takes an hour and a half on my 4090 to train the LoRA so I haven't tried
other sample sizes, and I figured it might need a small boost compared to
gpt-3.5-turbo since it's a much smaller model.

Rather than using the `#A A# #B B#` notation Taelin originally used, we just
use `A B C D` as tokens, to avoid possible model tokenization issues.

## Running the code

To get started:

```bash
npm install # install deps
npx tsc # compile typescript
```

### Getting started with OpenAI

Make sure to add a `.env` file with the following env vars:

```bash
OPENAI_API_KEY="your-key-here"
MODEL_NAME="eventually once you have a trained model, put the model ID here"
```

To train a model, run:

```bash
node build/finetune.js
```

To try a random interaction net, update your `.env` file with the model ID that
you trained and run:

```bash
node build/test.js
```

### Getting started with Mistral

First, install [Ollama](https://ollama.com/), since we use that for
OpenAI-compatible inference. Then make sure to add a `.env` file in the root of
this repo with the following env vars:

```bash
OPENAI_API_KEY="ollama" # doesn't matter what this is, it just needs to exist
MODEL_NAME="clevergpt-mistral"
OPENAI_API_BASE="http://127.0.0.1:11434"
```

Then generate some training data:

```
npx tsc
node build/generate-lora-data.js
```

Then, finetune a Mistral LoRA:

```bash
./scripts/train-lora.sh
```

Next, clone and set up the llama.cpp repo:

```bash
git clone git@github.com:ggerganov/llama.cpp.git
cd llama.cpp

# Install Python deps
python3 -m venv llamacpp
source llamacpp/bin/activate
python3 -m pip install -r requirements.txt
```

Now, while in the llama.cpp directory with your venv active, run:

```bash
python convert-lora-to-ggml ../path/to/clevergpt/lora-out
```

Make sure the path is to the `lora-out` directory in this repo, not just to the
repo itself!

Finally, create an ollama model from the Modelfile in this repo:

```bash
cd /path/to/clevergpt
ollama create clevergpt-mistral ./Modelfile
```

If ollama isn't already running, run:

```bash
ollama serve
```

Finally:

```bash
node build/test.js
```
