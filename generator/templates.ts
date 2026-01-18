/**
 * Project Template Files
 *
 * Functions to generate template files for C++/CMake projects.
 */

interface ProjectConfig {
  name: string;
  nameLower: string;
  nameUpper: string;
  author: string;
  version: string;
}

// =============================================================================
// CMake
// =============================================================================

export function generateCMakeLists(config: ProjectConfig): string {
  return `cmake_minimum_required(VERSION 3.15)
project(${config.name} VERSION ${config.version} LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Static library: ${config.nameLower}_core
add_library(${config.nameLower}_core STATIC
    src/core/core.cpp
    src/core/core.h
)
target_include_directories(${config.nameLower}_core PUBLIC
    \${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Shared library: ${config.nameLower}_utils
add_library(${config.nameLower}_utils SHARED
    src/utils/utils.cpp
    src/utils/utils.h
)
target_include_directories(${config.nameLower}_utils PUBLIC
    \${CMAKE_CURRENT_SOURCE_DIR}/src
)
target_compile_definitions(${config.nameLower}_utils PRIVATE ${config.nameUpper}_UTILS_EXPORTS)

# Executable: ${config.nameLower}
add_executable(${config.nameLower}
    src/main.cpp
)
target_link_libraries(${config.nameLower} PRIVATE
    ${config.nameLower}_core
    ${config.nameLower}_utils
)
`;
}

// =============================================================================
// Deno Build System
// =============================================================================

export function generateDenoJson(): string {
  return `{
  "tasks": {
    "build": "deno run --allow-all build.ts",
    "build:debug": "deno run --allow-all build.ts --config Debug",
    "build:release": "deno run --allow-all build.ts --config Release",
    "clean": "deno run --allow-all build.ts --clean",
    "rebuild": "deno run --allow-all build.ts --clean && deno run --allow-all build.ts --config Release",
    "test": "deno run --allow-all build.ts --test",
    "format": "deno fmt",
    "format:check": "deno fmt --check",
    "lint": "deno lint"
  },
  "fmt": {
    "files": {
      "include": ["build.ts", "build.config.ts", "cmake-file-api.ts", "cmake-types.ts"]
    }
  },
  "lint": {
    "files": {
      "include": ["build.ts", "build.config.ts", "cmake-file-api.ts", "cmake-types.ts"]
    }
  }
}
`;
}

export function generateBuildConfig(config: ProjectConfig): string {
  return `export interface BuildConfig {
  projectName: string;
  version: string;
  author: string;
  buildTypes: string[];
}

export const config: BuildConfig = {
  projectName: "${config.name}",
  version: "${config.version}",
  author: "${config.author}",
  buildTypes: ["Debug", "Release"],
};
`;
}

export function generateBuildScript(): string {
  return `#!/usr/bin/env -S deno run --allow-all

import $ from "jsr:@david/dax@0.42.0";
import { parseArgs } from "jsr:@std/cli@1.0.6/parse-args";
import { config } from "./build.config.ts";
import {
  setupFileAPI,
  parseFileAPI,
  printArtifacts,
} from "./cmake-file-api.ts";
import type { BuildArtifact } from "./cmake-types.ts";

// Parse command line arguments
const args = parseArgs(Deno.args, {
  boolean: ["clean", "test"],
  string: ["config", "generator"],
  default: {
    config: "Release",
    generator: Deno.build.os === "windows" ? "Visual Studio 17 2022" : "Unix Makefiles",
  },
});

async function clean(): Promise<void> {
  console.log("🧹 Cleaning build directory...");
  await $\`rm -rf build dist\`;
}

async function configure(): Promise<void> {
  console.log("⚙️  Configuring CMake...");

  await $\`mkdir -p build\`;

  // Setup File API query
  await setupFileAPI("build");

  // Run CMake configuration
  await $\`cmake -B build -DCMAKE_BUILD_TYPE=\${args.config} -G \${args.generator}\`;
}

async function build(): Promise<BuildArtifact[]> {
  console.log("🔨 Building project...");

  // Use different commands for Windows and other platforms
  if (Deno.build.os === "windows") {
    await $\`cmake --build build --config \${args.config}\`;
  } else {
    await $\`cmake --build build --config \${args.config} --parallel\`;
  }

  // Auto-detect build artifacts
  const artifacts = await parseFileAPI("build");
  printArtifacts(artifacts);

  return artifacts;
}

async function runTests(artifacts: BuildArtifact[]): Promise<void> {
  console.log("🧪 Running tests...");

  // Prefer executable matching the build configuration
  // (to distinguish Debug/Release in MSVC multi-config builds)
  let executable = artifacts.find(
    (a) => a.type === "EXECUTABLE" && a.path.includes(args.config)
  );

  // Fall back to any executable if not found
  if (!executable) {
    executable = artifacts.find((a) => a.type === "EXECUTABLE");
  }

  if (!executable) {
    console.log("⚠️  No executable found to test");
    return;
  }

  console.log(\`   Executing: \${executable.path}\`);

  // Run the executable for testing
  await $\`\${executable.path}\`;
}

// Main entry point
async function main(): Promise<void> {
  try {
    console.log(\`🚀 Building \${config.projectName} v\${config.version}\`);
    console.log(\`   Configuration: \${args.config}\`);
    console.log(\`   Platform: \${Deno.build.os}\`);
    console.log("");

    if (args.clean) {
      await clean();
      Deno.exit(0);
    }

    await configure();
    const artifacts = await build();

    if (args.test) {
      await runTests(artifacts);
    }

    console.log("\\n✅ Build completed successfully!");
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    Deno.exit(1);
  }
}

await main();
`;
}

export function generateCMakeFileAPI(): string {
  return `import $ from "jsr:@david/dax@0.42.0";
import { walk } from "jsr:@std/fs@1.0.8/walk";
import { join, normalize } from "jsr:@std/path@1.0.8";
import type {
  FileAPIIndex,
  CodeModelV2,
  TargetInfo,
  BuildArtifact,
} from "./cmake-types.ts";

/**
 * Generate CMake File API query file
 */
export async function setupFileAPI(buildDir: string): Promise<void> {
  const queryDir = join(buildDir, ".cmake", "api", "v1", "query");
  await $\`mkdir -p \${queryDir}\`;

  // Request codemodel-v2
  const queryFile = join(queryDir, "codemodel-v2");
  await Deno.writeTextFile(queryFile, "");

  console.log("✅ CMake File API query created");
}

/**
 * Parse CMake File API response
 */
export async function parseFileAPI(
  buildDir: string
): Promise<BuildArtifact[]> {
  const replyDir = join(buildDir, ".cmake", "api", "v1", "reply");

  // Check if reply directory exists
  try {
    await Deno.stat(replyDir);
  } catch {
    throw new Error(
      \`CMake File API reply directory not found: \${replyDir}\\nRun cmake configure first.\`
    );
  }

  // Find index files using Deno's walk
  const indexFiles: string[] = [];
  for await (const entry of walk(replyDir, { maxDepth: 1, includeFiles: true, includeDirs: false })) {
    if (entry.name.startsWith("index-") && entry.name.endsWith(".json")) {
      indexFiles.push(entry.path);
    }
  }

  if (indexFiles.length === 0) {
    throw new Error(
      \`CMake File API index file not found in \${replyDir}\\nRun cmake configure first.\`
    );
  }

  // Read the latest index file (sorted by filename)
  indexFiles.sort();
  const indexPath = indexFiles[indexFiles.length - 1];

  console.log(\`📄 Reading CMake File API: \${indexPath}\`);

  const index: FileAPIIndex = JSON.parse(
    await Deno.readTextFile(indexPath)
  );

  // Get codemodel-v2
  const codemodelRef = index.reply["codemodel-v2"];
  if (!codemodelRef) {
    throw new Error("codemodel-v2 not found in File API response");
  }

  const codemodelPath = join(replyDir, codemodelRef.jsonFile);
  const codemodel: CodeModelV2 = JSON.parse(
    await Deno.readTextFile(codemodelPath)
  );

  // Collect target information
  const artifacts: BuildArtifact[] = [];

  for (const config of codemodel.configurations) {
    for (const targetRef of config.targets) {
      const targetPath = join(replyDir, targetRef.jsonFile);
      const target: TargetInfo = JSON.parse(
        await Deno.readTextFile(targetPath)
      );

      // Only include executables, static libraries, and shared libraries
      if (
        target.type === "EXECUTABLE" ||
        target.type === "STATIC_LIBRARY" ||
        target.type === "SHARED_LIBRARY"
      ) {
        if (target.artifacts && target.artifacts.length > 0) {
          for (const artifact of target.artifacts) {
            // Normalize path (CMake uses forward slashes)
            const artifactPath = artifact.path.replace(/\\\\/g, "/");
            const fullPath = normalize(join(codemodel.paths.build, artifactPath));

            artifacts.push({
              name: target.name,
              type: target.type,
              path: fullPath,
            });
          }
        }
      }
    }
  }

  return artifacts;
}

/**
 * Print build artifacts
 */
export function printArtifacts(artifacts: BuildArtifact[]): void {
  console.log("\\n📦 Build Artifacts:");
  console.log("─".repeat(80));

  const grouped = new Map<string, BuildArtifact[]>();

  for (const artifact of artifacts) {
    if (!grouped.has(artifact.type)) {
      grouped.set(artifact.type, []);
    }
    grouped.get(artifact.type)!.push(artifact);
  }

  for (const [type, items] of grouped) {
    console.log(\`\\n\${type}:\`);
    for (const item of items) {
      console.log(\`  • \${item.name}\`);
      console.log(\`    \${item.path}\`);
    }
  }

  console.log("\\n" + "─".repeat(80));
}
`;
}

export function generateCMakeTypes(): string {
  return `/**
 * CMake File API v1 response type definitions
 */
export interface FileAPIIndex {
  cmake: {
    version: {
      string: string;
      major: number;
      minor: number;
      patch: number;
    };
  };
  objects: Array<{
    kind: string;
    version: { major: number; minor: number };
    jsonFile: string;
  }>;
  reply: {
    [key: string]: {
      kind: string;
      version: { major: number; minor: number };
      jsonFile: string;
    };
  };
}

export interface CodeModelV2 {
  version: { major: number; minor: number };
  paths: {
    source: string;
    build: string;
  };
  configurations: Array<{
    name: string;
    targets: Array<{
      name: string;
      id: string;
      type: string;
      jsonFile: string;
    }>;
  }>;
}

export interface TargetInfo {
  name: string;
  type: "EXECUTABLE" | "STATIC_LIBRARY" | "SHARED_LIBRARY" | "MODULE_LIBRARY" | "OBJECT_LIBRARY";
  artifacts?: Array<{
    path: string;
  }>;
  nameOnDisk?: string;
  sources?: Array<{
    path: string;
  }>;
  dependencies?: Array<{
    id: string;
  }>;
}

export interface BuildArtifact {
  name: string;
  type: string;
  path: string;
}
`;
}

// =============================================================================
// C++ Source Files
// =============================================================================

export function generateMainCpp(config: ProjectConfig): string {
  return `#include <iostream>
#include <vector>

#include "core/core.h"
#include "utils/utils.h"

int main()
{
    ${config.nameLower}::utils::printBanner("${config.name} Calculator");

    ${config.nameLower}::core::Calculator calc;

    std::cout << "Version: " << calc.getVersion() << std::endl;
    std::cout << std::endl;

    std::vector<std::string> operations;

    int result1 = calc.add(10, 5);
    operations.push_back("10 + 5 = " + std::to_string(result1));

    int result2 = calc.multiply(10, 5);
    operations.push_back("10 x 5 = " + std::to_string(result2));

    std::cout << ${config.nameLower}::utils::join(operations, "\\n") << std::endl;

    return 0;
}
`;
}

export function generateCoreHeader(config: ProjectConfig): string {
  return `#pragma once

#include <string>

namespace ${config.nameLower}
{
namespace core
{

class Calculator
{
public:
    int add(int a, int b);
    int multiply(int a, int b);
    std::string getVersion();
};

} // namespace core
} // namespace ${config.nameLower}
`;
}

export function generateCoreSource(config: ProjectConfig): string {
  return `#include "core.h"

namespace ${config.nameLower}
{
namespace core
{

int Calculator::add(int a, int b)
{
    return a + b;
}

int Calculator::multiply(int a, int b)
{
    return a * b;
}

std::string Calculator::getVersion()
{
    return "${config.version}";
}

} // namespace core
} // namespace ${config.nameLower}
`;
}

export function generateUtilsHeader(config: ProjectConfig): string {
  return `#pragma once

#include <string>
#include <vector>

// Export macro for Windows DLL
#ifdef _WIN32
    #ifdef ${config.nameUpper}_UTILS_EXPORTS
        #define ${config.nameUpper}_UTILS_API __declspec(dllexport)
    #else
        #define ${config.nameUpper}_UTILS_API __declspec(dllimport)
    #endif
#else
    #define ${config.nameUpper}_UTILS_API
#endif

namespace ${config.nameLower}
{
namespace utils
{

${config.nameUpper}_UTILS_API std::string join(const std::vector<std::string>& items, const std::string& delimiter);
${config.nameUpper}_UTILS_API void printBanner(const std::string& text);

} // namespace utils
} // namespace ${config.nameLower}
`;
}

export function generateUtilsSource(config: ProjectConfig): string {
  return `#include "utils.h"

#include <iostream>
#include <sstream>

namespace ${config.nameLower}
{
namespace utils
{

std::string join(const std::vector<std::string>& items, const std::string& delimiter)
{
    std::ostringstream oss;
    for (size_t i = 0; i < items.size(); ++i) {
        if (i > 0) oss << delimiter;
        oss << items[i];
    }
    return oss.str();
}

void printBanner(const std::string& text)
{
    std::string border(text.length() + 4, '=');
    std::cout << border << std::endl;
    std::cout << "| " << text << " |" << std::endl;
    std::cout << border << std::endl;
}

} // namespace utils
} // namespace ${config.nameLower}
`;
}

// =============================================================================
// Git
// =============================================================================

export function generateGitignore(): string {
  return `# Build directories
build/
dist/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Deno
deno.lock

# CMake
CMakeCache.txt
CMakeFiles/
cmake_install.cmake
compile_commands.json
Makefile

# Compiled binaries
*.exe
*.dll
*.so
*.dylib
*.a
*.lib
*.o
*.obj
`;
}
