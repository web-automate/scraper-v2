# AI Article Scraper API

A TypeScript-based service to generate articles using AI (ChatGPT/Gemini) via Puppeteer scraping. Features a job queue system with RabbitMQ and automated OpenAPI documentation.

## 🚀 Tech Stack

- **Runtime:** Node.js & TypeScript
- **Framework:** Express.js
- **Browser Automation:** Puppeteer Core
- **Queue:** RabbitMQ
- **Validation:** Zod
- **Docs:** Swagger UI (Zod-to-OpenAPI)

## 🛠️ Prerequisites

- Node.js (v18+)
- pnpm
- RabbitMQ Server (Running)
- Google Chrome (Installed on system)

## 📦 Installation

1. **Install Dependencies**
   ```bash
   pnpm install


2. **Environment Setup**
Copy `.env.example` to `.env` and configure:
    ```env
    PORT=3000
    HOST=localhost
    AI_PROVIDER=chatgpt  # or gemini
    DEBUG_PORT=9222
    RABBITMQ_URL=amqp://localhost
    ```

## ▶️ Usage

### Development Mode
Starts the API server, worker, and live-reloads on changes.

    ```bash
    pnpm dev
    ```

### Generate Documentation
Manually regenerate `swagger-output.json` from Zod schemas.

    ```bash
    pnpm swagger
    ```

## 📚 API Documentation
Once the server is running, access the Swagger UI at:

> **http://localhost:3000/api/docs**

## 📂 Key Folders

* `src/routes`: API endpoints & OpenAPI definitions.
* `src/lib`: Zod schemas & shared utilities.
* `src/service`: Business logic (Browser, RabbitMQ, Scraper).
* `src/worker`: Background job processors.
* `sessions`: Saved browser sessions/cookies.