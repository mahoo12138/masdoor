# Code style

- Do not add Go tests (`_test.go`) unless explicitly asked.
- Keep comments sparse: only for genuinely non-obvious mechanics, not one per block.

# Frontend (`web`)

`web` is the shadcn/Tailwind frontend. Intentionally omitted features:

- **AI assistant.** The `aiAssistantUrl` config, its header button and the iframe
  drawer (`ai-assistant` entry) are dropped. Do not add them.
- **Web3 providers.** The `Web3` category (MetaMask, Web3-Onboard) was removed
  from the backend and `web`. Do not add wallet sign-in code.
