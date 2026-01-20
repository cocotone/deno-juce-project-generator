/**
 * Visual Studio Version Detection Utility
 *
 * Detects installed Visual Studio versions on Windows.
 * Supports Visual Studio 2019, 2022, and 2026.
 */

import { join } from "jsr:@std/path@1.0.8";

export interface VSVersion {
  year: string;
  version: string;
  generator: string;
  path?: string;
}

// Supported Visual Studio versions
export const SUPPORTED_VS_VERSIONS: VSVersion[] = [
  {
    year: "18",
    version: "18",
    generator: "Visual Studio 18 2026",
  },
  {
    year: "2022",
    version: "17",
    generator: "Visual Studio 17 2022",
  },
  {
    year: "2019",
    version: "16",
    generator: "Visual Studio 16 2019",
  },
];

/**
 * Detect installed Visual Studio versions by checking common installation paths
 */
export async function detectInstalledVSVersions(): Promise<VSVersion[]> {
  if (Deno.build.os !== "windows") {
    return [];
  }

  const installedVersions: VSVersion[] = [];

  try {
    // Common Visual Studio installation base paths
    const basePaths = [
      join("C:", "Program Files", "Microsoft Visual Studio"),
      join("C:", "Program Files (x86)", "Microsoft Visual Studio"),
    ];

    // Check each supported version
    for (const vsVersion of SUPPORTED_VS_VERSIONS) {
      for (const basePath of basePaths) {
        // Try both Community, Professional, and Enterprise editions
        const editions = ["Community", "Professional", "Enterprise"];

        for (const edition of editions) {
          const fullPath = join(basePath, vsVersion.year, edition);

          try {
            const stat = await Deno.stat(fullPath);
            if (stat.isDirectory) {
              // Check if VC tools are installed
              const vcToolsPath = join(fullPath, "VC", "Tools", "MSVC");
              try {
                await Deno.stat(vcToolsPath);
                installedVersions.push({
                  ...vsVersion,
                  path: fullPath,
                });
                break; // Found this version, no need to check other editions
              } catch {
                // VC tools not found in this edition, try next
              }
            }
          } catch {
            // This path doesn't exist, try next
          }
        }
      }
    }
  } catch (error) {
    console.warn("⚠️  Failed to detect Visual Studio versions:", error);
    return [];
  }

  return installedVersions;
}

/**
 * Get the latest installed Visual Studio version
 */
export async function getLatestVSVersion(): Promise<VSVersion | null> {
  const installed = await detectInstalledVSVersions();

  if (installed.length === 0) {
    return null;
  }

  // Return the first one (already sorted by newest first in SUPPORTED_VS_VERSIONS)
  return installed[0];
}

/**
 * Get Visual Studio generator by year
 */
export function getVSGeneratorByYear(year: string): string | null {
  const vsVersion = SUPPORTED_VS_VERSIONS.find((v) => v.year === year);
  return vsVersion ? vsVersion.generator : null;
}

/**
 * Validate Visual Studio version string
 */
export function isValidVSVersion(version: string): boolean {
  return SUPPORTED_VS_VERSIONS.some((v) => v.year === version);
}

/**
 * Get default Visual Studio generator
 * If version is specified, use it. Otherwise, auto-detect the latest.
 */
export async function getDefaultVSGenerator(
  specifiedVersion?: string
): Promise<string> {
  // If version is explicitly specified
  if (specifiedVersion) {
    if (!isValidVSVersion(specifiedVersion)) {
      throw new Error(
        `Invalid Visual Studio version: ${specifiedVersion}. Supported: ${
          SUPPORTED_VS_VERSIONS.map((v) => v.year).join(", ")
        }`
      );
    }
    return getVSGeneratorByYear(specifiedVersion)!;
  }

  // Auto-detect the latest installed version
  const latest = await getLatestVSVersion();

  if (latest) {
    console.log(
      `✅ Auto-detected Visual Studio ${latest.year} at: ${latest.path}`
    );
    return latest.generator;
  }

  // Fallback to VS 2022 if auto-detection fails
  console.warn(
    "⚠️  Could not auto-detect Visual Studio. Falling back to Visual Studio 2022."
  );
  return "Visual Studio 17 2022";
}
