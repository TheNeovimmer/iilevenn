# iilevenn

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&text=iilevenn&height=200&fontSize=80&animation=fadeIn&desc=Voice+Synthesis+Platform&descAlignY=50&descSize=30" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Node.js-20+-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Drizzle-ORM-purple?logo=drizzle" />
  <img src="https://img.shields.io/badge/Python-3.11+-yellow?logo=python" />
  <img src="https://img.shields.io/badge/Docker-24+-blue?logo=docker" />
  <img src="https://img.shields.io/badge/License-MIT-orange" />
</p>

---

## ✨ Introduction

Welcome to **iilevenn** — a modern voice synthesis platform that transforms text into lifelike speech. Think of it as your personal voice studio, where cutting-edge technology meets elegant design.

This project was crafted with care, designed to be both powerful and approachable. Whether you're a developer looking to integrate TTS capabilities or a creator seeking to bring your words to life, iilevenn has something special for you.

---

## 🌟 Features

| Feature                 | Description                                        |
| ----------------------- | -------------------------------------------------- |
| 🎤 **Voice Library**    | Browse and manage a collection of unique AI voices |
| 🔐 **Secure Auth**      | JWT-based authentication with API key management   |
| ⚡ **Async Processing** | Background job processing with RabbitMQ            |
| 📦 **Object Storage**   | Audio file management via MinIO                    |
| 🗄️ **Modern Database**  | PostgreSQL powered by Drizzle ORM                  |
| 🚀 **API Gateway**      | Traefik-powered routing and load balancing         |
| 🐳 **Containerized**    | Full Docker Compose setup for easy deployment      |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Traefik Gateway                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Auth Service │    │ Voice Service │    │ Worker Service│
│   (TypeScript)│    │  (TypeScript) │    │  (TypeScript) │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
        ┌─────────────────────────────────────────────┐
        │              PostgreSQL + Redis + RabbitMQ    │
        └─────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │              TTS Engine (Python)             │
        └─────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │              MinIO Storage                   │
        └─────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose
- Python 3.11+ (for local TTS development)

### Installation

```bash
# Clone the repository
git clone https://github.com/TheNeovimmer/iilevenn.git
cd iilevenn

# Install dependencies
pnpm install

# Start infrastructure
pnpm infra

# Setup database
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Development

```bash
# Start all services
pnpm dev:auth
pnpm dev:voice
pnpm dev:worker
pnpm dev:web
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
POSTGRES_USER=iileven
POSTGRES_PASSWORD=iileven_dev
POSTGRES_DB=iileven
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://iileven:iileven_dev@localhost:5672
MINIO_ACCESS_KEY=iileven
MINIO_SECRET_KEY=iileven_dev_secret
JWT_SECRET=your-secret-key
```

---

## 📁 Project Structure

```
iilevenn/
├── packages/
│   └── db/                 # Database schema & migrations
├── services/
│   ├── auth/               # Authentication service
│   ├── voice/              # Voice management API
│   ├── worker/             # Background job processor
│   ├── tts/                # Text-to-Speech engine
│   └── gateway/            # Traefik configuration
└── docker-compose.yml      # Infrastructure setup
```

---

## 🛠️ Available Scripts

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `pnpm lint`       | Run linting across all packages |
| `pnpm typecheck`  | Type check all TypeScript files |
| `pnpm infra`      | Start Docker infrastructure     |
| `pnpm infra:down` | Stop infrastructure             |
| `pnpm db:studio`  | Open Drizzle Studio             |

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ by [TheNeovimmer](https://github.com/TheNeovimmer)
- Powered by [Coqui TTS](https://github.com/coqui-ai/TTS)
- Inspired by the open-source community

---

<p align="center">
  <sub>Made with ☕ and lots of late-night coding sessions</sub>
</p>
