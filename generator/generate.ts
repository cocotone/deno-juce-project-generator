#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-net

/**
 * JUCE Audio Plugin Project Generator
 *
 * Generate a JUCE audio plugin project locally by running from a remote URL.
 * JUCE framework is automatically cloned from GitHub during project generation.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run --allow-net \
 *     https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts
 *
 * Options:
 *   --name <string>              Plugin name (default: "MyPlugin")
 *   --author <string>            Author/Company name (default: "Your Name")
 *   --version <string>           Version (default: "0.0.1")
 *   --output <string>            Output directory (default: plugin name)
 *   --manufacturer-code <string> 4-char manufacturer code (default: "Manu")
 *   --plugin-code <string>       4-char plugin code (default: "Plug")
 *   --with-git                   Initialize git repository
 *   --juce-tag <string>          JUCE git tag/branch (default: "master")
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
} from "./juce-templates.ts";

export interface JucePluginConfig {
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
}

function showHelp(): void {
  console.log(`
JUCE Audio Plugin Project Generator
=====================================

Usage:
  deno run --allow-read --allow-write --allow-run --allow-net <script-url> [options]

Options:
  --name <string>              Plugin name (default: "MyPlugin")
  --author <string>            Author/Company name (default: "Your Name")
  --version <string>           Version (default: "0.0.1")
  --output <string>            Output directory (default: plugin name)
  --manufacturer-code <string> 4-char manufacturer code (default: "Manu")
  --plugin-code <string>       4-char plugin code (default: "Plug")
  --with-git                   Initialize git repository
  --juce-tag <string>          JUCE git tag/branch (default: "master")
  --help                       Show this help

Example:
  deno run --allow-read --allow-write --allow-run --allow-net \\
    https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \\
    --name "MySynth" --author "Cocotone" --output ./my-synth --with-git
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

async function generateProject(config: JucePluginConfig): Promise<void> {
  console.log(`\n🎹 Generating JUCE Audio Plugin: ${config.name}`);
  console.log(`   Output directory: ${config.outputDir}`);
  console.log(`   Author: ${config.author}`);
  console.log(`   Version: ${config.version}`);
  console.log(`   Manufacturer Code: ${config.manufacturerCode}`);
  console.log(`   Plugin Code: ${config.pluginCode}`);
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

  // Plugin source files
  await createFile(
    join(config.outputDir, "Source", "PluginProcessor.h"),
    generatePluginProcessorH(config),
    "Source/PluginProcessor.h"
  );

  await createFile(
    join(config.outputDir, "Source", "PluginProcessor.cpp"),
    generatePluginProcessorCpp(config),
    "Source/PluginProcessor.cpp"
  );

  await createFile(
    join(config.outputDir, "Source", "PluginEditor.h"),
    generatePluginEditorH(config),
    "Source/PluginEditor.h"
  );

  await createFile(
    join(config.outputDir, "Source", "PluginEditor.cpp"),
    generatePluginEditorCpp(config),
    "Source/PluginEditor.cpp"
  );

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
  console.log("✨ JUCE Audio Plugin project generated successfully!");
  console.log("═".repeat(60));
  console.log(`
Next steps:
  1. cd ${config.outputDir}
  2. deno task build          # Build the plugin
  3. deno task build:debug    # Build in Debug mode

Available tasks:
  • deno task build           - Build in Release mode
  • deno task build:debug     - Build in Debug mode
  • deno task clean           - Clean build directory
  • deno task rebuild         - Clean and rebuild
  • deno task format          - Format TypeScript files
  • deno task lint            - Lint TypeScript files

Generated plugin formats:
  • AU (Audio Unit) - macOS
  • VST3 - Windows/macOS/Linux
  • Standalone - All platforms

Plugin location after build:
  • macOS: build/${config.namePascal}_artefacts/
  • Windows: build/${config.namePascal}_artefacts/
  • Linux: build/${config.namePascal}_artefacts/
`);
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["help", "with-git"],
    string: ["name", "author", "version", "output", "manufacturer-code", "plugin-code", "juce-tag"],
    default: {
      name: "MyPlugin",
      author: "Your Name",
      version: "0.0.1",
      "manufacturer-code": "Manu",
      "plugin-code": "Plug",
      "juce-tag": "master",
    },
    alias: {
      h: "help",
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

  const projectName = args.name;
  const namePascal = toPascalCase(projectName);
  const nameSnake = toSnakeCase(projectName);
  const nameUpper = nameSnake.toUpperCase();

  const config: JucePluginConfig = {
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
  };

  await generateProject(config);
}

await main();
