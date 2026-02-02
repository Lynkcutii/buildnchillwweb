---
description: Repository Information Overview
alwaysApply: true
---

# BuildnChill Minecraft - Lunar New Year 2026 Information

## Repository Summary
This repository contains the ecosystem for the **BuildnChill Minecraft** server, specifically themed for the Lunar New Year 2026. It consists of a **React-based management website** and a **Minecraft Spigot plugin**. The system integrates with **Supabase** for real-time data synchronization and **Discord** for order notifications.

## Repository Structure
- [./src/](./src/): Frontend source code for the React website.
- [./MinecraftShopPlugin/](./MinecraftShopPlugin/): Java source code and configuration for the Minecraft Spigot plugin.
- [./tests/](./tests/): End-to-end test suites using Playwright.
- [./public/](./public/): Static assets for the web application.
- [./dist/](./dist/): Production build artifacts for the website.

### Main Repository Components
- **Website**: A React management dashboard and store featuring a Tet 2026 theme, handling product CRUD, order management, and statistics.
- **Minecraft Plugin**: A Java plugin that polls the Supabase database for paid orders and executes corresponding commands in-game.

## Projects

### BuildnChill Website (Frontend)
**Configuration File**: [./package.json](./package.json)

#### Language & Runtime
**Language**: JavaScript (React)  
**Version**: React 18.2, Node.js (Vite 5.0)  
**Build System**: Vite  
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `@supabase/supabase-js`: Database and authentication.
- `framer-motion`: UI animations and effects.
- `react-router-dom`: Frontend routing.
- `quill`: Rich text editor for news/product descriptions.
- `react-helmet-async`: SEO and meta tag management.

**Development Dependencies**:
- `@playwright/test`: E2E testing framework.
- `vite`: Build tool and dev server.

#### Build & Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

#### Testing
**Framework**: Playwright  
**Test Location**: [./tests/](./tests/)  
**Naming Convention**: `*.spec.js`  
**Configuration**: [./playwright.config.js](./playwright.config.js)

**Run Command**:
```bash
npx playwright test
```

---

### Minecraft Shop Plugin
**Configuration File**: [./MinecraftShopPlugin/pom.xml](./MinecraftShopPlugin/pom.xml)

#### Language & Runtime
**Language**: Java  
**Version**: 17  
**Build System**: Maven  
**Package Manager**: Maven

#### Dependencies
**Main Dependencies**:
- `spigot-api`: Spigot server API (1.20.4-R0.1-SNAPSHOT).

#### Build & Installation
```bash
# Build the plugin JAR
cd MinecraftShopPlugin && mvn clean package
```

#### Main Files & Resources
- **Entry Point**: [./MinecraftShopPlugin/src/main/java/com/buildnchill/shop/MinecraftShopPlugin.java](./MinecraftShopPlugin/src/main/java/com/buildnchill/shop/MinecraftShopPlugin.java)
- **Plugin Config**: [./MinecraftShopPlugin/src/main/resources/config.yml](./MinecraftShopPlugin/src/main/resources/config.yml) (Template)
- **Plugin Definition**: [./MinecraftShopPlugin/src/main/resources/plugin.yml](./MinecraftShopPlugin/src/main/resources/plugin.yml)
