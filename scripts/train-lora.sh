#!/bin/bash

set -eo pipefail

docker run --gpus '"all"' --rm \
  -v ./data:/data \
  -v ./lora-out:/lora-out \
  -v ./scripts/docker:/scripts \
  -v ${HOME}/.cache/huggingface:/root/.cache/huggingface \
  --entrypoint "/scripts/preprocess-and-train.sh" \
  winglian/axolotl:main-latest
