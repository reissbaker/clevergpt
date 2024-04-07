#!/bin/bash

set -eo pipefail

accelerate launch -m axolotl.cli.inference /data/dataset.yaml
