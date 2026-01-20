/**
 * Visual Studio Version Detection Utility
 *
 * Detects installed Visual Studio versions on Windows.
 * Supports Visual Studio 2019, 2022, and 2026.
 */

import $ from "jsr:@david/dax@0.42.0";

export interface VSVersion {
  year: string;
  version: string;
  generator: string;
  path?: string;
}

// Supported Visual Studio versions
export const SUPPORTED_VS_VERSIONS: VSVersion[] = [
  {
    year: "2026",
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
 * Detect installed Visual Studio versions using vswhere
 */
export async function detectInstalledVSVersions(): Promise<VSVersion[]> {
  if (Deno.build.os !== "windows") {
    return [];
  }

  const installedVersions: VSVersion[] = [];

  try {
    // Use vswhere to detect installed Visual Studio instances
    const vsWherePath =
      "C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe";

    // Check if vswhere exists
    try {
      await Deno.stat(vsWherePath);
    } catch {
      console.warn(
        "⚠️  vswhere.exe not found. Cannot auto-detect Visual Studio versions."
      );
      return [];
    }

    // Query all Visual Studio instances
    const result =
      await $`${vsWherePath} -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`
        .quiet()
        .noThrow();

    if (result.code !== 0) {
      return [];
    }

    const paths = result.stdout.trim().split("\n").filter((p) => p.trim());

    for (const path of paths) {
      // Extract version from path (e.g., "2022", "2019")
      const match = path.match(/\\(\d{4})\\/) ||
        path.match(/Visual Studio (\d{4})/);

      if (match) {
        const year = match[1];
        const vsVersion = SUPPORTED_VS_VERSIONS.find((v) => v.year === year);

        if (vsVersion) {
          installedVersions.push({
            ...vsVersion,
            path: path.trim(),
          });
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
