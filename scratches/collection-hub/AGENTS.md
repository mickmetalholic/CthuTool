# Collection Hub

- Use the Codex `SessionStart` hook output to detect user-started dev services and prefer those localhost URLs before starting any extra dev servers.
- Default dev URLs are `http://localhost:3000` for the Next.js web app and `http://localhost:3001` for the NestJS API.
- If you start a temporary service for verification, stop that service before finishing.
