/**
 * Visual Studio Version Detection Utility
 *
 * Detects installed Visual Studio versions on Windows using vswhere.exe.
 * Supports Visual Studio 2019, 2022, and 2026.
 */

import { join } from "jsr:@std/path@1.0.8";

export interface VSVersion {
  year: string;
  version: string;
  generator: string;
  path?: string;
  displayName?: string;
  installationVersion?: string;
}

/** Raw instance data from vswhere.exe output */
interface VSWhereInstance {
  instanceId: string;
  installationPath: string;
  installationVersion: string;
  displayName: string;
  productLineVersion: string; // "2022", "2019", or "18" for VS2026
}

/** Map from productLineVersion to CMake generator info */
const VS_VERSION_MAP: Record<string, { version: string; generatorYear: string }> = {
  "18": { version: "18", generatorYear: "2026" },
  "2022": { version: "17", generatorYear: "2022" },
  "2019": { version: "16", generatorYear: "2019" },
};

/** Supported Visual Studio versions for external use */
export const SUPPORTED_VS_VERSIONS: VSVersion[] = [
  { year: "2026", version: "18", generator: "Visual Studio 18 2026" },
  { year: "2022", version: "17", generator: "Visual Studio 17 2022" },
  { year: "2019", version: "16", generator: "Visual Studio 16 2019" },
];

/** Supported year values for validation */
const SUPPORTED_YEARS = SUPPORTED_VS_VERSIONS.map((v) => v.year);

/** Known Visual Studio installation paths for fallback detection */
const VS_KNOWN_PATHS: { year: string; paths: string[] }[] = [
  {
    year: "2026",
    paths: [
      join("C:", "Program Files", "Microsoft Visual Studio", "18", "Enterprise"),
      join("C:", "Program Files", "Microsoft Visual Studio", "18", "Professional"),
      join("C:", "Program Files", "Microsoft Visual Studio", "18", "Community"),
      join("C:", "Program Files", "Microsoft Visual Studio", "18", "Preview"),
    ],
  },
  {
    year: "2022",
    paths: [
      join("C:", "Program Files", "Microsoft Visual Studio", "2022", "Enterprise"),
      join("C:", "Program Files", "Microsoft Visual Studio", "2022", "Professional"),
      join("C:", "Program Files", "Microsoft Visual Studio", "2022", "Community"),
      join("C:", "Program Files", "Microsoft Visual Studio", "2022", "Preview"),
    ],
  },
  {
    year: "2019",
    paths: [
      join("C:", "Program Files (x86)", "Microsoft Visual Studio", "2019", "Enterprise"),
      join("C:", "Program Files (x86)", "Microsoft Visual Studio", "2019", "Professional"),
      join("C:", "Program Files (x86)", "Microsoft Visual Studio", "2019", "Community"),
      join("C:", "Program Files (x86)", "Microsoft Visual Studio", "2019", "Preview"),
    ],
  },
];

/** Get the default vswhere.exe path */
function getVSWherePath(): string {
  return join(
    "C:",
    "Program Files (x86)",
    "Microsoft Visual Studio",
    "Installer",
    "vswhere.exe"
  );
}

/**
 * Parse vswhere.exe text output into structured instances
 */
function parseVSWhereOutput(output: string): VSWhereInstance[] {
  const instances: VSWhereInstance[] = [];
  // Handle both Windows (\r\n) and Unix (\n) line endings
  const normalizedOutput = output.replace(/\r\n/g, "\n");
  const blocks = normalizedOutput.trim().split(/\n\n+/);

  for (const block of blocks) {
    if (!block.trim()) continue;

    const props: Record<string, string> = {};
    for (const line of block.split("\n")) {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        props[match[1].trim()] = match[2].trim();
      }
    }

    // Extract required fields
    if (props["instanceId"] && props["installationPath"]) {
      instances.push({
        instanceId: props["instanceId"],
        installationPath: props["installationPath"],
        installationVersion: props["installationVersion"] || "",
        displayName: props["displayName"] || "",
        productLineVersion: props["catalog_productLineVersion"] || "",
      });
    }
  }

  return instances;
}

/**
 * Convert VSWhereInstance to VSVersion
 */
function instanceToVSVersion(instance: VSWhereInstance): VSVersion | null {
  const mapEntry = VS_VERSION_MAP[instance.productLineVersion];
  if (!mapEntry) {
    return null;
  }

  return {
    year: mapEntry.generatorYear,
    version: mapEntry.version,
    generator: `Visual Studio ${mapEntry.version} ${mapEntry.generatorYear}`,
    path: instance.installationPath,
    displayName: instance.displayName,
    installationVersion: instance.installationVersion,
  };
}

/**
 * Fallback: Detect Visual Studio by checking known installation paths
 */
async function detectVSByKnownPaths(): Promise<VSVersion[]> {
  const versions: VSVersion[] = [];

  for (const entry of VS_KNOWN_PATHS) {
    for (const vsPath of entry.paths) {
      try {
        const stat = await Deno.stat(vsPath);
        if (stat.isDirectory) {
          const vsVersion = SUPPORTED_VS_VERSIONS.find((v) => v.year === entry.year);
          if (vsVersion) {
            versions.push({
              ...vsVersion,
              path: vsPath,
            });
            // Found one for this year, skip other editions
            break;
          }
        }
      } catch {
        // Path doesn't exist, continue
      }
    }
  }

  return versions;
}

/**
 * Execute vswhere.exe and return raw output
 */
async function runVSWhere(): Promise<string> {
  const vsWherePath = getVSWherePath();
  const command = new Deno.Command(vsWherePath, {
    args: ["-all", "-prerelease"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`vswhere.exe failed with code ${code}: ${errorText}`);
  }

  return new TextDecoder().decode(stdout);
}

/**
 * Detect installed Visual Studio versions using vswhere.exe
 * Falls back to checking known installation paths if vswhere.exe fails
 */
export async function detectInstalledVSVersions(): Promise<VSVersion[]> {
  if (Deno.build.os !== "windows") {
    return [];
  }

  // Try vswhere.exe first
  const vswhereResult = await detectVSByVSWhere();
  if (vswhereResult.length > 0) {
    return vswhereResult;
  }

  // Fallback to known paths
  console.warn("⚠️  Falling back to known path detection...");
  return await detectVSByKnownPaths();
}

/**
 * Detect Visual Studio using vswhere.exe
 */
async function detectVSByVSWhere(): Promise<VSVersion[]> {
  const vsWherePath = getVSWherePath();
  try {
    // Check if vswhere.exe exists
    await Deno.stat(vsWherePath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.warn(`⚠️  vswhere.exe not found at: ${vsWherePath}`);
    } else if (error instanceof Deno.errors.PermissionDenied) {
      console.warn(
        `⚠️  Permission denied accessing vswhere.exe. Run with --allow-read flag.`
      );
    } else {
      console.warn(`⚠️  Failed to check vswhere.exe: ${error}`);
    }
    return [];
  }

  try {
    const output = await runVSWhere();
    const instances = parseVSWhereOutput(output);

    const versions: VSVersion[] = [];
    for (const instance of instances) {
      const vsVersion = instanceToVSVersion(instance);
      if (vsVersion) {
        versions.push(vsVersion);
      }
    }

    // Sort by version number (newest first)
    versions.sort((a, b) => parseInt(b.version) - parseInt(a.version));

    return versions;
  } catch (error) {
    console.warn("⚠️  Failed to run vswhere.exe:", error);
    return [];
  }
}

/**
 * Get the latest installed Visual Studio version
 */
export async function getLatestVSVersion(): Promise<VSVersion | null> {
  const installed = await detectInstalledVSVersions();

  if (installed.length === 0) {
    return null;
  }

  // Return the first one (already sorted by newest first)
  return installed[0];
}

/**
 * Get Visual Studio generator by year
 */
export function getVSGeneratorByYear(year: string): string | null {
  const vsVersion = SUPPORTED_VS_VERSIONS.find((v) => v.year === year);
  if (!vsVersion) {
    return null;
  }
  return vsVersion.generator;
}

/**
 * Validate Visual Studio version string
 */
export function isValidVSVersion(version: string): boolean {
  return SUPPORTED_YEARS.includes(version);
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
        `Invalid Visual Studio version: ${specifiedVersion}. Supported: ${SUPPORTED_YEARS.join(", ")}`
      );
    }
    return getVSGeneratorByYear(specifiedVersion)!;
  }

  // Auto-detect the latest installed version
  const latest = await getLatestVSVersion();

  if (latest) {
    console.log(
      `✅ Auto-detected ${latest.displayName || `Visual Studio ${latest.year}`} at: ${latest.path}`
    );
    return latest.generator;
  }

  // Fallback to VS 2022 if auto-detection fails
  console.warn(
    "⚠️  Could not auto-detect Visual Studio. Falling back to Visual Studio 2022."
  );
  return "Visual Studio 17 2022";
}
