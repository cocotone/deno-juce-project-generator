#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-net --allow-env

/**
 * JUCE Project Generator
 *
 * Generate a JUCE project (audio plugin, GUI application, or console application)
 * locally by running from a remote URL.
 * JUCE framework is automatically cloned from GitHub during project generation.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run --allow-net --allow-env \
 *     https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts
 *
 * Options:
 *   --type <string>              Project type: plugin, gui, or cli (default: "plugin")
 *   --name <string>              Project name (default: "MyPlugin" / "MyApp" / "MyCli")
 *   --author <string>            Author/Company name (default: "Your Name")
 *   --version <string>           Version (default: "0.0.1")
 *   --output <string>            Output directory (default: project name)
 *   --manufacturer-code <string> 4-char manufacturer code (default: "Manu", plugin only)
 *   --plugin-code <string>       4-char plugin code (default: "Plug", plugin only)
 *   --with-git                   Initialize git repository
 *   --juce-tag <string>          JUCE git tag/branch (default: "master")
 *   --vs-version <string>        Visual Studio version: 2019, 2022, or 2026 (Windows only, default: auto-detect)
 *   --help                       Show help
 */

import $ from "jsr:@david/dax@0.42.0";
import { parseArgs } from "jsr:@std/cli@1.0.6/parse-args";
import { join } from "jsr:@std/path@1.0.8";
import { ensureDir } from "jsr:@std/fs@1.0.8/ensure-dir";
import { exists } from "jsr:@std/fs@1.0.8/exists";

import {
  generateJuceCMakeLists,
  generateJuceDenoJson,
  generateJuceBuildScript,
  generateJuceBuildConfig,
  generateJuceCMakeFileAPI,
  generateJuceCMakeTypes,
  generateJuceGitignore,
  generatePluginProcessorH,
  generatePluginProcessorCpp,
  generatePluginEditorH,
  generatePluginEditorCpp,
  generateGuiAppMainCpp,
  generateMainComponentH,
  generateMainComponentCpp,
  generateConsoleAppMainCpp,
} from "./juce-templates.ts";

// URL for vs-detector.ts (resolved relative to this script)
const VS_DETECTOR_URL = new URL("./vs-detector.ts", import.meta.url).href;

export type ProjectType = "plugin" | "gui" | "cli";

const PROJECT_TYPES: Record<ProjectType, { label: string; defaultName: string }> = {
  plugin: { label: "JUCE Audio Plugin", defaultName: "MyPlugin" },
  gui: { label: "JUCE GUI Application", defaultName: "MyApp" },
  cli: { label: "JUCE Console Application", defaultName: "MyCli" },
};

function isProjectType(value: string): value is ProjectType {
  return value in PROJECT_TYPES;
}

export interface JuceProjectConfig {
  projectType: ProjectType;
  name: string;
  namePascal: string;
  nameSnake: string;
  nameUpper: string;
  author: string;
  version: string;
  outputDir: string;
  manufacturerCode: string;
  pluginCode: string;
  withGit: boolean;
  juceTag: string;
  vsVersion?: string;
}

/** @deprecated Use JuceProjectConfig */
export type JucePluginConfig = JuceProjectConfig;

function showHelp(): void {
  console.log(`
JUCE Project Generator
======================

Usage:
  deno run --allow-read --allow-write --allow-run --allow-net --allow-env <script-url> [options]

Options:
  --type <string>              Project type (default: "plugin")
                                 plugin - Audio plugin (VST3 / AU / Standalone)
                                 gui    - Desktop GUI application
                                 cli    - Console (command-line) application
  --name <string>              Project name (default: "MyPlugin" / "MyApp" / "MyCli")
  --author <string>            Author/Company name (default: "Your Name")
  --version <string>           Version (default: "0.0.1")
  --output <string>            Output directory (default: project name)
  --manufacturer-code <string> 4-char manufacturer code (default: "Manu", plugin only)
  --plugin-code <string>       4-char plugin code (default: "Plug", plugin only)
  --with-git                   Initialize git repository
  --juce-tag <string>          JUCE git tag/branch (default: "master")
  --vs-version <string>        Visual Studio version: 2019, 2022, or 2026 (Windows only, default: auto-detect)
  --help                       Show this help

Examples:
  deno run --allow-read --allow-write --allow-run --allow-net \\
    https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \\
    --name "MySynth" --author "Cocotone" --output ./my-synth --with-git --vs-version 2022

  deno run -A https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \\
    --type gui --name "MyApp"

  deno run -A https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \\
    --type cli --name "MyCli"
`);
}

function toPascalCase(str: string): string {
  return str
    .replace(/[\s_-]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

async function createFile(
  path: string,
  content: string,
  description: string
): Promise<void> {
  await Deno.writeTextFile(path, content);
  console.log(`  ✅ ${description}: ${path}`);
}

async function downloadFile(
  url: string,
  destPath: string,
  description: string
): Promise<void> {
  console.log(`  ⬇️  Downloading ${description}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const content = await response.text();
  await Deno.writeTextFile(destPath, content);
  console.log(`  ✅ ${description}: ${destPath}`);
}

async function cloneJuce(outputDir: string, juceTag: string): Promise<void> {
  const juceDir = join(outputDir, "External", "JUCE");

  console.log("\n📦 Cloning JUCE framework...");
  console.log(`   Repository: https://github.com/juce-framework/JUCE.git`);
  console.log(`   Tag/Branch: ${juceTag}`);
  console.log(`   Destination: ${juceDir}`);

  // Create External directory
  await ensureDir(join(outputDir, "External"));

  // Clone JUCE using dax
  try {
    await $`git clone --depth 1 --branch ${juceTag} https://github.com/juce-framework/JUCE.git ${juceDir}`;
    console.log("  ✅ JUCE cloned successfully");
  } catch (error) {
    console.error("  ❌ Failed to clone JUCE:", error);
    console.error("     Make sure git is installed and you have internet access.");
    Deno.exit(1);
  }
}

interface SourceFile {
  fileName: string;
  content: string;
}

function getSourceFiles(config: JuceProjectConfig): SourceFile[] {
  switch (config.projectType) {
    case "gui":
      return [
        { fileName: "Main.cpp", content: generateGuiAppMainCpp(config) },
        { fileName: "MainComponent.h", content: generateMainComponentH() },
        { fileName: "MainComponent.cpp", content: generateMainComponentCpp(config) },
      ];
    case "cli":
      return [
        { fileName: "Main.cpp", content: generateConsoleAppMainCpp() },
      ];
    default:
      return [
        { fileName: "PluginProcessor.h", content: generatePluginProcessorH(config) },
        { fileName: "PluginProcessor.cpp", content: generatePluginProcessorCpp(config) },
        { fileName: "PluginEditor.h", content: generatePluginEditorH(config) },
        { fileName: "PluginEditor.cpp", content: generatePluginEditorCpp(config) },
      ];
  }
}

async function generateProject(config: JuceProjectConfig): Promise<void> {
  const typeLabel = PROJECT_TYPES[config.projectType].label;

  console.log(`\n🎹 Generating ${typeLabel}: ${config.name}`);
  console.log(`   Output directory: ${config.outputDir}`);
  console.log(`   Author: ${config.author}`);
  console.log(`   Version: ${config.version}`);
  if (config.projectType === "plugin") {
    console.log(`   Manufacturer Code: ${config.manufacturerCode}`);
    console.log(`   Plugin Code: ${config.pluginCode}`);
  }
  console.log("");

  // Check if the directory already exists
  if (await exists(config.outputDir)) {
    const entries = [];
    for await (const entry of Deno.readDir(config.outputDir)) {
      entries.push(entry);
    }
    if (entries.length > 0) {
      console.error(`❌ Error: Directory "${config.outputDir}" is not empty.`);
      console.error("   Please choose an empty directory or a new path.");
      Deno.exit(1);
    }
  }

  // Create directory structure
  console.log("📁 Creating directory structure...");
  const dirs = [
    config.outputDir,
    join(config.outputDir, "Source"),
    join(config.outputDir, "External"),
  ];

  for (const dir of dirs) {
    await ensureDir(dir);
    console.log(`  📂 ${dir}`);
  }

  // Clone JUCE
  await cloneJuce(config.outputDir, config.juceTag);

  console.log("\n📝 Generating files...");

  // CMakeLists.txt
  await createFile(
    join(config.outputDir, "CMakeLists.txt"),
    generateJuceCMakeLists(config),
    "CMakeLists.txt"
  );

  // Deno/TypeScript build system
  await createFile(
    join(config.outputDir, "deno.json"),
    generateJuceDenoJson(),
    "deno.json"
  );

  await createFile(
    join(config.outputDir, "build.ts"),
    generateJuceBuildScript(),
    "build.ts"
  );

  await createFile(
    join(config.outputDir, "build.config.ts"),
    generateJuceBuildConfig(config),
    "build.config.ts"
  );

  await createFile(
    join(config.outputDir, "cmake-file-api.ts"),
    generateJuceCMakeFileAPI(),
    "cmake-file-api.ts"
  );

  await createFile(
    join(config.outputDir, "cmake-types.ts"),
    generateJuceCMakeTypes(),
    "cmake-types.ts"
  );

  await downloadFile(
    VS_DETECTOR_URL,
    join(config.outputDir, "vs-detector.ts"),
    "vs-detector.ts"
  );

  // Source files
  for (const file of getSourceFiles(config)) {
    await createFile(
      join(config.outputDir, "Source", file.fileName),
      file.content,
      `Source/${file.fileName}`
    );
  }

  // .gitignore
  await createFile(
    join(config.outputDir, ".gitignore"),
    generateJuceGitignore(),
    ".gitignore"
  );

  // Initialize git repository
  if (config.withGit) {
    console.log("\n🔧 Initializing git repository...");
    try {
      await $`git -C ${config.outputDir} init`;
      console.log("  ✅ Git repository initialized");
    } catch {
      console.log(
        "  ⚠️  Failed to initialize git repository (git may not be installed)"
      );
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log(`✨ ${typeLabel} project generated successfully!`);
  console.log("═".repeat(60));
  console.log(getNextStepsMessage(config));
}

function getNextStepsMessage(config: JuceProjectConfig): string {
  const runDescription = {
    plugin: "Build and run Standalone",
    gui: "Build and run the application",
    cli: "Build and run the application (pass args after --)",
  }[config.projectType];

  const outputs = {
    plugin: `Generated plugin formats:
  • AU (Audio Unit) - macOS
  • VST3 - Windows/macOS/Linux
  • Standalone - All platforms

Plugin location after build:`,
    gui: `Application location after build:`,
    cli: `Executable location after build:`,
  }[config.projectType];

  return `
Next steps:
  1. cd ${config.outputDir}
  2. deno task build          # Build in Release mode
  3. deno task run            # ${runDescription}

Available tasks:
  • deno task build           - Build in Release mode
  • deno task build:debug     - Build in Debug mode
  • deno task clean           - Clean build directory
  • deno task rebuild         - Clean and rebuild
  • deno task run             - ${runDescription}
  • deno task run:debug       - ${runDescription} (Debug)
  • deno task format          - Format TypeScript files
  • deno task lint            - Lint TypeScript files

${outputs}
  • build/${config.namePascal}_artefacts/<Configuration>/
`;
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["help", "with-git"],
    string: ["type", "name", "author", "version", "output", "manufacturer-code", "plugin-code", "juce-tag", "vs-version"],
    default: {
      type: "plugin",
      author: "Your Name",
      version: "0.0.1",
      "manufacturer-code": "Manu",
      "plugin-code": "Plug",
      "juce-tag": "master",
    },
    alias: {
      h: "help",
      t: "type",
      n: "name",
      a: "author",
      v: "version",
      o: "output",
    },
  });

  if (args.help) {
    showHelp();
    Deno.exit(0);
  }

  if (!isProjectType(args.type)) {
    console.error(`❌ Error: Invalid project type "${args.type}".`);
    console.error(`   Supported types: ${Object.keys(PROJECT_TYPES).join(", ")}`);
    Deno.exit(1);
  }
  const projectType = args.type;

  const projectName = args.name || PROJECT_TYPES[projectType].defaultName;
  const namePascal = toPascalCase(projectName);
  const nameSnake = toSnakeCase(projectName);
  const nameUpper = nameSnake.toUpperCase();

  const config: JuceProjectConfig = {
    projectType,
    name: projectName,
    namePascal,
    nameSnake,
    nameUpper,
    author: args.author,
    version: args.version,
    outputDir: args.output || projectName.toLowerCase().replace(/\s+/g, "-"),
    manufacturerCode: args["manufacturer-code"],
    pluginCode: args["plugin-code"],
    withGit: args["with-git"],
    juceTag: args["juce-tag"],
    vsVersion: args["vs-version"],
  };

  await generateProject(config);
}

await main();
