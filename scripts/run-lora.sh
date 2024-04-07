#!/bin/bash

set -eo pipefail

sudo docker run --gpus '"all"' --rm -it \
  -v ./data:/data \
  -v ./lora-out:/lora-out \
  -v ./scripts/docker:/scripts \
  -v ${HOME}/.cache/huggingface:/root/.cache/huggingface \
  winglian/axolotl:main-latest
