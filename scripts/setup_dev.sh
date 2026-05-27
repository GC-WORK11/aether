#!/bin/bash
# AETHER Studio - Development Setup Script

set -e

echo "Setting up AETHER Studio development environment..."

# Backend
echo "Installing Python dependencies..."
cd backend
pip install -e ".[dev]" 2>/dev/null || pip install -r requirements.txt
cd ..

# Frontend
echo "Installing Node dependencies..."
cd apps/desktop
npm install
cd ../..

echo ""
echo "Setup complete!"
echo ""
echo "To start development:"
echo "  cd apps/desktop && npm run electron:dev"
echo ""
echo "Or start backend separately:"
echo "  cd backend && uvicorn app.main:app --reload"
