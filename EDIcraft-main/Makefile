.PHONY: help install local deploy invoke clean configure venv

VENV := venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
AGENTCORE := $(VENV)/bin/agentcore

include config.ini
export

.DEFAULT_GOAL := help

help:
	@echo "EDIcraft Agent - Available Commands:"
	@echo ""
	@echo "  make install        - Create virtualenv and install dependencies"
	@echo "  make local   - Deploy agent locally and invoke interactively"
	@echo "  make deploy         - Deploy agent to cloud"
	@echo "  make invoke         - Invoke deployed agent (use: make invoke 'your prompt')"
	@echo ""

venv:
	python3 -m venv $(VENV)

install: venv
	$(PIP) install -r requirements.txt
	$(AGENTCORE) configure --non-interactive --entrypoint agent.py --name edicraft --requirements-file requirements.txt --disable-otel


local:
	. $(VENV)/bin/activate && $(AGENTCORE) launch --local \
		--env EDI_USERNAME=$(EDI_USERNAME) \
		--env EDI_PASSWORD=$(EDI_PASSWORD) \
		--env EDI_CLIENT_ID=$(EDI_CLIENT_ID) \
		--env EDI_CLIENT_SECRET=$(EDI_CLIENT_SECRET) \
		--env EDI_PARTITION=$(EDI_PARTITION) \
		--env EDI_PLATFORM_URL=$(EDI_PLATFORM_URL) \
		--env MINECRAFT_HOST=$(MINECRAFT_HOST) \
		--env MINECRAFT_RCON_PORT=$(MINECRAFT_RCON_PORT) \
		--env MINECRAFT_RCON_PASSWORD=$(MINECRAFT_RCON_PASSWORD)

deploy:
	. $(VENV)/bin/activate && $(AGENTCORE) launch --auto-update-on-conflict \
		--env EDI_USERNAME=$(EDI_USERNAME) \
		--env EDI_PASSWORD=$(EDI_PASSWORD) \
		--env EDI_CLIENT_ID=$(EDI_CLIENT_ID) \
		--env EDI_CLIENT_SECRET=$(EDI_CLIENT_SECRET) \
		--env EDI_PARTITION=$(EDI_PARTITION) \
		--env EDI_PLATFORM_URL=$(EDI_PLATFORM_URL) \
		--env MINECRAFT_HOST=$(MINECRAFT_HOST) \
		--env MINECRAFT_RCON_PORT=$(MINECRAFT_RCON_PORT) \
		--env MINECRAFT_RCON_PASSWORD=$(MINECRAFT_RCON_PASSWORD)

invoke:
	. $(VENV)/bin/activate && $(AGENTCORE) invoke '{"prompt": "$(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))"}'

%:
	@:
