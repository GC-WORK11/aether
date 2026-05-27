#!/bin/bash
cd "$(dirname "$0")/.."
cd apps/desktop
npm run electron:dev
