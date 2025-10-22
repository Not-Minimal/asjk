#!/usr/bin/env node

import {
  intro,
  outro,
  select,
  spinner,
  log,
  confirm,
  multiselect,
} from "@clack/prompts";
import chalk from "chalk";
import { spawn } from "child_process";
import os from "os";

console.clear();
intro(`${chalk.cyan("🚀 Bienvenido a Framework Selector CLI!")}`);

const hostname = os.hostname();
const shortHostname = hostname.split("-")[0];

// Función para construir el comando correcto según el framework y gestor de paquetes
const getFrameworkCommand = (framework, packageManager) => {
  const commands = {
    "Next.js": {
      npm: "npx create-next-app@latest",
      pnpm: "pnpm create next-app@latest",
      yarn: "yarn create next-app@latest",
      bun: "bun create next-app@latest",
    },
    Astro: {
      npm: "npm create astro@latest",
      pnpm: "pnpm create astro@latest",
      yarn: "yarn create astro",
      bun: "npm create astro@latest",
    },
    SvelteKit: {
      npm: "npx sv create",
      pnpm: "npx sv create",
      yarn: "npx sv create",
      bun: "npx sv create",
    },
    Vite: {
      npm: "npm create vite@latest",
      pnpm: "pnpm create vite",
      yarn: "yarn create vite",
      bun: "bun create vite",
    },
    "React Router": {
      npm: "npx create-react-router@latest",
      pnpm: "npx create-react-router@latest",
      yarn: "npx create-react-router@latest",
      bun: "npx create-react-router@latest",
    },
    Angular: {
      npm: "npm install -g @angular/cli",
      pnpm: "pnpm install -g @angular/cli",
      yarn: "yarn global add @angular/cli",
      bun: "bun install -g @angular/cli",
    },
    SolidStart: {
      npm: "npm init solid@latest",
      pnpm: "pnpm create solid@latest",
      yarn: "yarn create solid@latest",
      bun: "bun create solid@latest",
    },
    Qwik: {
      npm: "npm create qwik@latest",
      pnpm: "pnpm create qwik@latest",
      yarn: "yarn create qwik",
      bun: "bun create qwik@latest",
    },
    Preact: {
      npm: "npm init preact",
      pnpm: "npm init preact",
      yarn: "npm init preact",
      bun: "npm init preact",
    },
    "Nuxt.js": {
      npm: "npx nuxi init",
      pnpm: "npx nuxi init",
      yarn: "npx nuxi init",
      bun: "npx nuxi init",
    },
  };

  return (
    commands[framework]?.[packageManager] ||
    `${packageManager} create ${framework.toLowerCase()}@latest`
  );
};

const frameworks = [
  "Next.js",
  "Astro",
  "SvelteKit",
  "Vite",
  "React Router",
  "Angular",
  "SolidStart",
  "Qwik",
  "Preact",
  "Nuxt.js",
];

const packageManagers = ["npm", "pnpm", "yarn", "bun"];
const additionalLibraries = [
  { value: "eslint", label: "ESLint" },
  { value: "prettier", label: "Prettier" },
  { value: "tailwind", label: "Tailwind CSS" },
  { value: "react-router", label: "React Router" },
  { value: "axios", label: "Axios" },
];

(async () => {
  // Selección de framework
  const framework = await select({
    message: `👋 Hola, ${chalk.bold(shortHostname)}!, ¿en qué framework programaremos hoy?`,
    options: frameworks.map((name) => ({
      value: name,
      label: name,
    })),
  });

  if (!framework) {
    log.warn("🚨 Selección cancelada. No se ha instalado ningún framework.");
    process.exit(1);
  }

  // Selección de gestor de paquetes
  const packageManager = await select({
    message: "📦 ¿Qué gestor de paquetes deseas usar?",
    options: packageManagers.map((pm) => ({ value: pm, label: pm })),
  });

  // Preguntar si desea agregar librerías populares
  const includeExtras = await confirm({
    message: "¿Quieres incluir librerías populares?",
  });

  let extraPackages = [];
  if (includeExtras) {
    extraPackages = await multiselect({
      message:
        "Selecciona las librerías adicionales (usa espacio para seleccionar):",
      options: additionalLibraries,
      required: false,
    });
  }

  const command = getFrameworkCommand(framework, packageManager);
  log.step(
    `\n🚀 Preparando instalación de ${chalk.bold(framework)} con ${packageManager}...`,
  );

  const s = spinner();
  s.start(`🔧 Instalando ${chalk.green(framework)}...`);

  // 🔴 Detenemos la animación ANTES de ejecutar la instalación
  setTimeout(() => {
    s.stop();

    // Ejecutar el proceso y transferir control al usuario
    const child = spawn(command, { stdio: "inherit", shell: true });

    child.on("close", (code) => {
      if (code === 0) {
        log.success(`🎉 ${framework} ha sido instalado con éxito.`);
        if (includeExtras && extraPackages.length > 0) {
          log.step(
            `📦 Instalando librerías adicionales: ${extraPackages.join(", ")}`,
          );
          const installExtras = spawn(
            `${packageManager} add ${extraPackages.join(" ")}`,
            { stdio: "inherit", shell: true },
          );
          installExtras.on("close", () => {
            outro(
              "✨ ¡Listo! Ahora puedes empezar a programar con tu stack personalizado.",
            );
            process.exit(0);
          });
        } else {
          outro(
            "✨ ¡Listo! Ahora puedes empezar a programar con tu framework seleccionado.",
          );
        }
      } else {
        log.error(
          `❌ Error en la instalación de ${framework} (código: ${code}).`,
        );
      }
    });

    child.on("exit", () => process.exit(0));
  }, 100); // Pequeño delay para evitar que el spinner quede en pantalla
})();
