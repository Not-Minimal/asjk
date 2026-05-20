#!/usr/bin/env node

import {
	intro,
	outro,
	select,
	spinner,
	log,
	confirm,
	multiselect,
	text,
	isCancel,
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
		},
		Vite: {
			npm: "npm create vite@latest",
			pnpm: "pnpm create vite",
			yarn: "yarn create vite",
			bun: "bun create vite",
			deno: "deno init --npm vite",
		},
		"React Router": {
			npm: "npx create-react-router@latest",
		},
		Angular: {
			npm: "npm install -g @angular/cli",
			pnpm: "pnpm install -g @angular/cli",
			yarn: "yarn global add @angular/cli",
			bun: "bun install -g @angular/cli",
		},
		SolidStart: {
			npm: "npm create solid",
			pnpm: "pnpm create solid",
			yarn: "yarn create solid",
			bun: "bun create solid",
			deno: "deno init --npm solid",
		},
		Qwik: {
			npm: "npm create qwik@latest",
			pnpm: "pnpm create qwik@latest",
			yarn: "yarn create qwik",
			bun: "bun create qwik@latest",
		},
		Preact: {
			npm: "npm init preact",
		},
		Nuxt: {
			npm: "npm create nuxt@latest", // Comando oficial recomendado para Nuxt 3
		},
	};

	return (
		commands[framework]?.[packageManager] ||
		`${packageManager} create ${framework.toLowerCase()}@latest`
	);
};

// Se unificó "Nuxt" con el objeto de comandos
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
	"Nuxt",
];

const packageManagers = ["npm", "pnpm", "yarn", "bun", "deno"];
const additionalLibraries = [
	{ value: "eslint", label: "ESLint" },
	{ value: "prettier", label: "Prettier" },
	{ value: "tailwindcss", label: "Tailwind CSS" }, // Cambiado a 'tailwindcss' que es el paquete npm real
	{ value: "react-router-dom", label: "React Router DOM" },
	{ value: "axios", label: "Axios" },
];

// Helper para salir limpiamente si el usuario cancela con Ctrl+C o Esc
const handleCancel = (value) => {
	if (isCancel(value)) {
		outro(
			chalk.yellow("👋 Operación cancelada por el usuario. ¡Hasta pronto!"),
		);
		process.exit(0);
	}
};

(async () => {
	// 1. Selección de framework
	const framework = await select({
		message: `👋 Hola, ${chalk.bold(shortHostname)}!, ¿en qué framework programaremos hoy?`,
		options: frameworks.map((name) => ({
			value: name,
			label: name,
		})),
	});
	handleCancel(framework);

	// 2. Selección de gestor de paquetes
	const packageManager = await select({
		message: "📦 ¿Qué gestor de paquetes deseas usar?",
		options: packageManagers.map((pm) => ({ value: pm, label: pm })),
	});
	handleCancel(packageManager);

	// 3. Preguntar si desea agregar librerías populares
	const includeExtras = await confirm({
		message: "¿Quieres incluir librerías populares adicionales?",
		initialValue: false,
	});
	handleCancel(includeExtras);

	let extraPackages = [];
	let projectFolder = ".";

	if (includeExtras) {
		extraPackages = await multiselect({
			message:
				"Selecciona las librerías adicionales (usa espacio para seleccionar):",
			options: additionalLibraries,
			required: false,
		});
		handleCancel(extraPackages);

		// Si va a instalar extras, necesitamos saber dónde para hacer el 'cwd'
		if (extraPackages.length > 0) {
			projectFolder = await text({
				message:
					"¿Cuál es el nombre de la carpeta que vas a crear? (Necesario para instalar los extras adentro)",
				placeholder: "mi-proyecto",
				validate: (value) => {
					if (!value || value.trim() === "") {
						return "Por favor, introduce el nombre de la carpeta para instalar los paquetes extra.";
					}
				},
			});
			handleCancel(projectFolder);
		}
	}

	const command = getFrameworkCommand(framework, packageManager);
	log.step(
		`\n🚀 Preparando instalación de ${chalk.bold(framework)} con ${packageManager}...`,
	);

	const s = spinner();
	s.start(`🔧 Lanzando instalador de ${chalk.green(framework)}...`);

	// Detener la animación justo antes de spawn para que la terminal interactiva del framework funcione bien
	setTimeout(() => {
		s.stop();

		// Ejecutar el proceso interactivo de creación
		const child = spawn(command, { stdio: "inherit", shell: true });

		child.on("close", (code) => {
			if (code === 0) {
				log.success(`🎉 ${framework} ha sido inicializado con éxito.`);

				// Si hay paquetes extras, nos movemos a la carpeta e instalamos
				if (includeExtras && extraPackages.length > 0) {
					log.step(
						`📦 Instalando librerías adicionales: ${chalk.cyan(extraPackages.join(", "))} en ./${projectFolder}...`,
					);

					// Determinar comando de instalación según gestor de paquetes
					let installVerb = "install";
					if (
						packageManager === "yarn" ||
						packageManager === "bun" ||
						packageManager === "pnpm"
					) {
						installVerb = "add";
					} else if (packageManager === "deno") {
						installVerb = "add --npm";
					}

					const installCommand = `${packageManager} ${installVerb} ${extraPackages.join(" ")}`;

					const installExtras = spawn(installCommand, {
						stdio: "inherit",
						shell: true,
						cwd: projectFolder.trim(), // Ejecutar dentro de la subcarpeta creada
					});

					installExtras.on("close", (extraCode) => {
						if (extraCode === 0) {
							outro(
								`✨ ¡Listo todo! Entra a la carpeta con ${chalk.cyan(`cd ${projectFolder}`)} y empieza a programar.`,
							);
						} else {
							log.error(
								"⚠️ El framework se instaló pero hubo un problema instalando las librerías extra.",
							);
							outro(
								`Prueba entrar a ${chalk.cyan(projectFolder)} e instalarlas manualmente.`,
							);
						}
						process.exit(0);
					});
				} else {
					outro(
						`✨ ¡Listo! Ahora puedes empezar a programar en tu nuevo proyecto de ${framework}.`,
					);
					process.exit(0);
				}
			} else {
				log.error(
					`❌ Error en la inicialización de ${framework} (código de salida: ${code}).`,
				);
				process.exit(code);
			}
		});

		child.on("error", (err) => {
			log.error(`❌ No se pudo ejecutar el instalador: ${err.message}`);
			process.exit(1);
		});
	}, 500); // 500ms da una sensación más natural y limpia para el spinner
})();
