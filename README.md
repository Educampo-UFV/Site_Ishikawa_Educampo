# 🚀 Site Ishikawa Educampo

> [!NOTE]
> **Business Vision:** Web application for diagnostic assessment, farm management, and cause-and-effect (Ishikawa) analysis for Educampo consultants, integrating secure consultant authentication and producer registration via BFF proxy with the Ishikawa Educampo API v2.0.0.
> **Ref: Obsidian note [[bdd-consultant-authentication]]** | **Ref: Obsidian note [[sdd-consultant-authentication]]** | **Ref: Obsidian note [[bdd-cadastrar-fazenda]]** | **Ref: Obsidian note [[sdd-cadastrar-fazenda]]**

---

## 🛠️ Tech Stack

* **Core:** Next.js 16 (App Router / React 19 / TypeScript)
* **BFF & Edge:** Next.js Route Handlers & Edge Proxy (`src/proxy.ts`) with HttpOnly Session Cookies (`session_token`)
* **State Management & UI:** Zustand, Lucide React, Radix UI, TailwindCSS v4
* **Testing & Quality:** Jest 30, React Testing Library, ESLint

---

## 🏗️ High-Level Architecture

```mermaid
graph TD
    A["Browser / Next.js Client Component ('src/app/login/page.tsx', 'CadastrarFazendaSection')"] --> B["BFF Route Handler ('POST /api/auth')"]
    A --> C["BFF Route Handler ('GET /api/auth/me')"]
    A --> D["BFF Route Handler ('POST /api/auth/logout')"]
    A --> H["BFF Route Handler ('POST /api/produtores')"]
    E["Edge Proxy ('src/proxy.ts')"] -->|O(1) Cookie Validation| F["Protected Application Routes ('/formulario', etc.)"]
    B --> G["External API ('API_BASE_URL/api/auth/login')"]
    C --> G
    D --> G
    H --> I["External API ('API_BASE_URL/api/produtores')"]
```

---

## ⚡ Getting Started (Onboarding)

### Prerequisites
* **Node.js**: 20+
* **npm**: 10+

### Local Installation & Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/Educampo-UFV/Site_Ishikawa_Educampo.git
   cd Site_Ishikawa_Educampo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   API_BASE_URL=https://api.educampo.com.br
   API_KEY=your_api_key_here
   ```

4. **Run application in development mode:**
   ```bash
   npm run dev
   ```

---

## 🧰 Useful Commands

```bash
# Run complete test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 📄 License & Contribution

Internal project developed for Educampo. All rights reserved.