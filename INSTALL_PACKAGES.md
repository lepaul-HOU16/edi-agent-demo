# Install Required Python Packages

If the automatic installation fails, follow these manual steps:

## Quick Install

```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
python3 -m pip install -r requirements.txt
cd ../..
```

## Alternative: Install Specific Packages

If the requirements.txt install fails, install the key packages individually:

```bash
# Core packages
python3 -m pip install boto3
python3 -m pip install mcp
python3 -m pip install strands-agents
python3 -m pip install strands-agents-tools

# Additional dependencies
python3 -m pip install requests
python3 -m pip install numpy
python3 -m pip install pandas
```

## Verify Installation

```bash
# Test imports
python3 -c "import boto3; print('✅ boto3')"
python3 -c "import mcp; print('✅ mcp')"
python3 -c "from strands.agents import Agent; print('✅ strands-agents')"
```

## Troubleshooting

### Permission Denied

If you get permission errors, use `--user`:

```bash
python3 -m pip install --user -r requirements.txt
```

### pip Not Found

Install pip first:

```bash
# On macOS
python3 -m ensurepip --upgrade

# Or using Homebrew
brew install python3
```

### Virtual Environment (Recommended)

Use a virtual environment to avoid conflicts:

```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets

# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Install packages
pip install -r requirements.txt

# Now run deployment from this directory
cd ../..
python3 scripts/deploy-complete-system.py
```

## After Installation

Once packages are installed, run the deployment:

```bash
./scripts/quick-deploy.sh
```

Or directly:

```bash
python3 scripts/deploy-complete-system.py
```
