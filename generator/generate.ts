#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * C++/CMake Project Generator
 *
 * Generate a C++/CMake project locally by running from a remote URL.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/generator/generate.ts
 *
 * Options:
 *   --name <string>     Project name (default: "MyApp")
 *   --author <string>   Author name (default: "Your Name")
 *   --version <string>  Version (default: "1.0.0")
 *   --output <string>   Output directory (default: current directory)
 *   --with-git          Initialize git repository
 *   --help              Show help
 */

import { parseArgs } from "jsr:@std/cli@1.0.6/parse-args";
import { join } from "jsr:@std/path@1.0.8";
import { ensureDir } from "jsr:@std/fs@1.0.8/ensure-dir";
import { exists } from "jsr:@std/fs@1.0.8/exists";

import {
  generateCMakeLists,
  generateBuildConfig,
  generateBuildScript,
  generateCMakeFileAPI,
  generateCMakeTypes,
  generateDenoJson,
  generateGitignore,
  generateMainCpp,
  generateCoreHeader,
  generateCoreSource,
  generateUtilsHeader,
  generateUtilsSource,
} from "./templates.ts";

interface ProjectConfig {
  name: string;
  nameLower: string;
  nameUpper: string;
  author: string;
  version: string;
  outputDir: string;
  withGit: boolean;
}

function showHelp(): void {
  console.log(`
C++/CMake Project Generator
============================

Usage:
  deno run --allow-read --allow-write --allow-run <script-url> [options]

Options:
  --name <string>     Project name (default: "MyApp")
  --author <string>   Author name (default: "Your Name")
  --version <string>  Version (default: "1.0.0")
  --output <string>   Output directory (default: current directory)
  --with-git          Initialize git repository
  --help              Show this help

Example:
  deno run --allow-read --allow-write --allow-run https://example.com/generate.ts \\
    --name "MyProject" --author "John Doe" --output ./my-project --with-git
`);
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

async function generateProject(config: ProjectConfig): Promise<void> {
  console.log(`\n🚀 Generating C++/CMake project: ${config.name}`);
  console.log(`   Output directory: ${config.outputDir}`);
  console.log(`   Author: ${config.author}`);
  console.log(`   Version: ${config.version}`);
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
    join(config.outputDir, "src"),
    join(config.outputDir, "src", "core"),
    join(config.outputDir, "src", "utils"),
  ];

  for (const dir of dirs) {
    await ensureDir(dir);
    console.log(`  📂 ${dir}`);
  }

  console.log("\n📝 Generating files...");

  // CMakeLists.txt
  await createFile(
    join(config.outputDir, "CMakeLists.txt"),
    generateCMakeLists(config),
    "CMakeLists.txt"
  );

  // Deno/TypeScript build system
  await createFile(
    join(config.outputDir, "deno.json"),
    generateDenoJson(),
    "deno.json"
  );

  await createFile(
    join(config.outputDir, "build.ts"),
    generateBuildScript(),
    "build.ts"
  );

  await createFile(
    join(config.outputDir, "build.config.ts"),
    generateBuildConfig(config),
    "build.config.ts"
  );

  await createFile(
    join(config.outputDir, "cmake-file-api.ts"),
    generateCMakeFileAPI(),
    "cmake-file-api.ts"
  );

  await createFile(
    join(config.outputDir, "cmake-types.ts"),
    generateCMakeTypes(),
    "cmake-types.ts"
  );

  // C++ source files
  await createFile(
    join(config.outputDir, "src", "main.cpp"),
    generateMainCpp(config),
    "src/main.cpp"
  );

  await createFile(
    join(config.outputDir, "src", "core", "core.h"),
    generateCoreHeader(config),
    "src/core/core.h"
  );

  await createFile(
    join(config.outputDir, "src", "core", "core.cpp"),
    generateCoreSource(config),
    "src/core/core.cpp"
  );

  await createFile(
    join(config.outputDir, "src", "utils", "utils.h"),
    generateUtilsHeader(config),
    "src/utils/utils.h"
  );

  await createFile(
    join(config.outputDir, "src", "utils", "utils.cpp"),
    generateUtilsSource(config),
    "src/utils/utils.cpp"
  );

  // .gitignore
  await createFile(
    join(config.outputDir, ".gitignore"),
    generateGitignore(),
    ".gitignore"
  );

  // Initialize git repository
  if (config.withGit) {
    console.log("\n🔧 Initializing git repository...");
    const cmd = new Deno.Command("git", {
      args: ["init"],
      cwd: config.outputDir,
      stdout: "piped",
      stderr: "piped",
    });
    const result = await cmd.output();
    if (result.success) {
      console.log("  ✅ Git repository initialized");
    } else {
      console.log(
        "  ⚠️  Failed to initialize git repository (git may not be installed)"
      );
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("✨ Project generated successfully!");
  console.log("═".repeat(60));
  console.log(`
Next steps:
  1. cd ${config.outputDir}
  2. deno task build          # Build the project
  3. deno task test           # Build and run the executable

Available tasks:
  • deno task build           - Build in Release mode
  • deno task build:debug     - Build in Debug mode
  • deno task clean           - Clean build directory
  • deno task rebuild         - Clean and rebuild
  • deno task test            - Build and run tests
  • deno task format          - Format TypeScript files
  • deno task lint            - Lint TypeScript files
`);
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["help", "with-git"],
    string: ["name", "author", "version", "output"],
    default: {
      name: "MyApp",
      author: "Your Name",
      version: "1.0.0",
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
  const nameLower = toSnakeCase(projectName);
  const nameUpper = nameLower.toUpperCase();

  const config: ProjectConfig = {
    name: projectName,
    nameLower,
    nameUpper,
    author: args.author,
    version: args.version,
    outputDir: args.output || projectName.toLowerCase().replace(/\s+/g, "-"),
    withGit: args["with-git"],
  };

  await generateProject(config);
}

await main();
