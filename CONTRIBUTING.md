# Contributing to iilevenn

First off — thank you! Your interest in contributing to iilevenn means a lot. Every contribution, whether it's a bug fix, a new feature, or just a documentation improvement, helps make this project better for everyone.

This guide will walk you through everything you need to know to start contributing. Let's get started!

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Submitting Your Work](#submitting-your-work)
6. [Style Guides](#style-guides)
7. [Recognition](#recognition)

---

## Code of Conduct

We want iilevenn to be a welcoming, inclusive space for everyone. By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** — Treat others with kindness and empathy
- **Be inclusive** — Welcome newcomers and diverse perspectives
- **Be constructive** — Offer feedback that's helpful, not harsh
- **Speak up** — If you see something wrong, say something

If you experience or witness any behavior that violates these principles, please get in touch. We'll handle it promptly and seriously.

---

## Getting Started

### Explore First

Before diving in, take some time to:

- Read the [README](README.md) to understand what iilevenn does
- Browse the codebase to get a feel for the structure
- Check out existing issues to see what's needed

### Pick Your Path

Not sure where to start? Here are some ideas:

| Your Interest    | Where to Look                           |
| ---------------- | --------------------------------------- |
| 🐛 Bug fixes     | Look for `bug` and `help wanted` labels |
| ✨ New features  | Check `enhancement` labels              |
| 📖 Documentation | Search for `docs` tags                  |
| 🎨 UI/UX         | Browse `ui` and `ux` labels             |
| 🔍 Code quality  | Find `refactoring` issues               |

If there's no issue for what you want to work on — go ahead and create one! It's always better to discuss before investing a lot of time.

---

## Development Setup

### Prerequisites

Make sure you have these installed:

- **Node.js** (v20 or later)
- **pnpm** (v10 or later)
- **Docker** & **Docker Compose**
- **Git**

### Quick Setup

```bash
# 1. Fork the repository
# Click the "Fork" button on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/iilevenn.git
cd iilevenn

# 3. Add the original repository as upstream
git remote add upstream https://github.com/TheNeovimmer/iilevenn.git

# 4. Install dependencies
pnpm install

# 5. Start the infrastructure
pnpm infra

# 6. Set up the database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 7. Create a feature branch
git checkout -b feature/your-awesome-feature
```

### Keeping Your Fork Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Rebase your branch
git rebase upstream/main
```

---

## Making Changes

### Code Guidelines

#### TypeScript Style

We follow a few simple rules to keep the code consistent:

- **Use meaningful names** — Variables and functions should describe what they do
- **Keep functions small** — If a function does more than one thing, split it up
- **Type everything** — Avoid `any` unless absolutely necessary
- **Comment the why, not the what** — Explain reasoning, not implementation

```typescript
// ✅ Good
async function fetchUserVoiceLibrary(userId: string): Promise<Voice[]> {
  return db.query.voices.findMany({
    where: eq(voices.userId, userId),
  })
}

// ❌ Avoid
async function getData(id: string) {
  return db.query.voices.findMany({
    /* ... */
  })
}
```

#### Git Commit Messages

Write clear, concise commit messages that explain _what_ changed and _why_:

```
✅ Good:
- Add voice preview endpoint
- Fix authentication middleware error handling
- Update database schema for voice samples

❌ Avoid:
- Fixed stuff
- WIP
- asdfgh
```

#### Pre-commit Checks

Before pushing, make sure everything passes:

```bash
# Run linting
pnpm lint

# Run type checking
pnpm typecheck
```

---

## Submitting Your Work

### Pull Request Process

1. **Create a PR** — Go to GitHub and open a pull request against `main`
2. **Fill out the template** — Provide context about what you changed and why
3. **Wait for review** — We'll get back to you within a few days
4. **Make changes if needed** — Address any feedback constructively
5. **Merge!** — Once approved, your changes will be merged

### PR Template

```markdown
## Description

Briefly describe what you changed and why.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other

## Testing

Describe how you tested your changes.

## Screenshots (if applicable)

Add screenshots to help explain your changes.
```

### What Happens Next

- **Review** — We'll review your code and leave feedback
- **Changes** — You might need to make some adjustments
- **Approval** — Once everything looks good, we'll approve
- **Merge** — Your code gets merged into the main branch

---

## Style Guides

### Commit Message Format

We use a simple convention:

```
<type>(<scope>): <description>

[optional body]
```

**Types:**

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting
- `refactor` — Code restructuring
- `test` — Adding tests
- `chore` — Maintenance

**Examples:**

```
feat(voice): add voice preview playback
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
```

### File Naming

- **TypeScript** — `camelCase` for files (e.g., `voiceService.ts`)
- **Components** — `PascalCase` (e.g., `VoiceCard.tsx`)
- **Config files** — `kebab-case` (e.g., `docker-compose.yml`)

---

## Recognition

Every contributor matters! Here's how we acknowledge help:

- **Contributors page** — Your name will be added to the GitHub contributors list
- **Special thanks** — Notable contributions get mentioned in release notes
- **Community spotlight** — Outstanding contributors may be featured

Thank you for being part of the iilevenn community. Every line of code, every bug report, and every kind word helps make this project shine.

---

## Questions?

Don't hesitate to reach out:

- **Open an issue** — For bugs or feature requests
- **Start a discussion** — For questions or ideas
- **Send a message** — For anything else

We're here to help!

---

<p align="center">
  <sub>Created with ❤️ by <a href="https://github.com/TheNeovimmer">TheNeovimmer</a></sub>
</p>
