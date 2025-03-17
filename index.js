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

// Lista de frameworks con sus comandos base
const frameworks = {
  Vite: "create vite",
  Astro: "create astro",
  SvelteKit: "create svelte",
  "Next.js": "create-next-app",
  "Nuxt.js": "nuxi init",
  Remix: "create-remix",
  Angular: "@angular/cli new",
  SolidStart: "create-solid",
  Qwik: "create qwik",
  Preact: "init preact",
};

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
    options: Object.keys(frameworks).map((name) => ({
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

  const command = `${packageManager} ${frameworks[framework]}@latest`;
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
