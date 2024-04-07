#!/bin/bash

set -eo pipefail

# preprocess datasets - optional but recommended
CUDA_VISIBLE_DEVICES="" python -m axolotl.cli.preprocess /data/dataset.yaml

# finetune lora
accelerate launch -m axolotl.cli.train /data/dataset.yaml
