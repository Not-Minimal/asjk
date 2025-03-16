#!/usr/bin/env node

import { intro, outro, select, spinner, log } from "@clack/prompts";
import chalk from "chalk";
import { spawn } from "child_process";
import os from "os";

console.clear();
intro(`${chalk.cyan("🚀 Bienvenido a Framework Selector CLI!")}`);

const hostname = os.hostname();
const shortHostname = hostname.split("-")[0];

// Lista de frameworks con sus comandos
const frameworks = {
  Vite: ["npm", ["create", "vite@latest"]],
  Astro: ["npm", ["create", "astro@latest"]],
  SvelteKit: ["npm", ["create", "svelte@latest"]],
  "Next.js": ["npx", ["create-next-app@latest"]],
  "Nuxt.js": ["npx", ["nuxi", "init"]],
  Remix: ["npx", ["create-remix@latest"]],
  Angular: ["npx", ["@angular/cli", "new"]],
  SolidStart: ["npx", ["create-solid@latest"]],
  Qwik: ["npm", ["create", "qwik@latest"]],
  Preact: ["npm", ["init", "preact"]],
};

(async () => {
  const framework = await select({
    message: `👋 Hola, ${chalk.bold(shortHostname)}!, en que framework programaremos hoy?`,
    options: Object.keys(frameworks).map((name) => ({
      value: name,
      label: name,
    })),
  });

  if (!framework) {
    log.warn("🚨 Selección cancelada. No se ha instalado ningún framework.");
    process.exit(1);
  }

  const [cmd, args] = frameworks[framework];

  log.step(`\n🚀 Preparando instalación de ${chalk.bold(framework)}...`);

  const s = spinner();
  s.start(`🔧 Instalando ${chalk.green(framework)}...`);

  // 🔴 Detenemos la animación ANTES de ejecutar la instalación
  setTimeout(() => {
    s.stop();

    // Ejecutar el proceso y transferir control al usuario
    const child = spawn(cmd, args, { stdio: "inherit", shell: true });

    child.on("close", (code) => {
      if (code === 0) {
        log.success(`🎉 ${framework} ha sido instalado con éxito.`);
        outro(`✨ ¡Listo! Ahora puedes empezar a programar con ${framework}.`);
      } else {
        log.error(
          `❌ Error en la instalación de ${framework} (código: ${code}).`,
        );
      }
    });

    child.on("exit", () => process.exit(0));
  }, 100); // Pequeño delay para evitar que el spinner quede en pantalla
})();
