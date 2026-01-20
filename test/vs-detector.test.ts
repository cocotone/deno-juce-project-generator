/**
 * Unit tests for Visual Studio Detector
 */

import { assertEquals, assertExists } from "jsr:@std/assert@1.0.10";
import {
  SUPPORTED_VS_VERSIONS,
  detectInstalledVSVersions,
  getLatestVSVersion,
  getVSGeneratorByYear,
  isValidVSVersion,
  getDefaultVSGenerator,
} from "../generator/vs-detector.ts";

Deno.test("SUPPORTED_VS_VERSIONS should have correct structure", () => {
  assertEquals(SUPPORTED_VS_VERSIONS.length, 3);

  // Check VS 2026
  assertEquals(SUPPORTED_VS_VERSIONS[0].year, "2026");
  assertEquals(SUPPORTED_VS_VERSIONS[0].version, "18");
  assertEquals(SUPPORTED_VS_VERSIONS[0].generator, "Visual Studio 18 2026");

  // Check VS 2022
  assertEquals(SUPPORTED_VS_VERSIONS[1].year, "2022");
  assertEquals(SUPPORTED_VS_VERSIONS[1].version, "17");
  assertEquals(SUPPORTED_VS_VERSIONS[1].generator, "Visual Studio 17 2022");

  // Check VS 2019
  assertEquals(SUPPORTED_VS_VERSIONS[2].year, "2019");
  assertEquals(SUPPORTED_VS_VERSIONS[2].version, "16");
  assertEquals(SUPPORTED_VS_VERSIONS[2].generator, "Visual Studio 16 2019");
});

Deno.test("getVSGeneratorByYear should return correct generator", () => {
  assertEquals(
    getVSGeneratorByYear("2026"),
    "Visual Studio 18 2026"
  );
  assertEquals(
    getVSGeneratorByYear("2022"),
    "Visual Studio 17 2022"
  );
  assertEquals(
    getVSGeneratorByYear("2019"),
    "Visual Studio 16 2019"
  );
  assertEquals(getVSGeneratorByYear("2015"), null);
  assertEquals(getVSGeneratorByYear("invalid"), null);
});

Deno.test("isValidVSVersion should validate version strings", () => {
  assertEquals(isValidVSVersion("2026"), true);
  assertEquals(isValidVSVersion("2022"), true);
  assertEquals(isValidVSVersion("2019"), true);
  assertEquals(isValidVSVersion("2015"), false);
  assertEquals(isValidVSVersion("invalid"), false);
  assertEquals(isValidVSVersion(""), false);
});

Deno.test("detectInstalledVSVersions should return empty array on non-Windows", async () => {
  // Skip on Windows
  if (Deno.build.os === "windows") {
    return;
  }

  const versions = await detectInstalledVSVersions();
  assertEquals(versions, []);
});

Deno.test("getLatestVSVersion should return null on non-Windows", async () => {
  // Skip on Windows
  if (Deno.build.os === "windows") {
    return;
  }

  const latest = await getLatestVSVersion();
  assertEquals(latest, null);
});

Deno.test("getDefaultVSGenerator should use specified version", async () => {
  const generator = await getDefaultVSGenerator("2022");
  assertEquals(generator, "Visual Studio 17 2022");
});

Deno.test("getDefaultVSGenerator should throw on invalid version", async () => {
  let errorThrown = false;
  try {
    await getDefaultVSGenerator("2015");
  } catch (error) {
    errorThrown = true;
    if (error instanceof Error) {
      assertExists(error.message);
      assertEquals(
        error.message.includes("Invalid Visual Studio version"),
        true
      );
    }
  }
  assertEquals(errorThrown, true);
});

Deno.test("getDefaultVSGenerator should fallback to VS 2022 on non-Windows", async () => {
  // Skip on Windows
  if (Deno.build.os === "windows") {
    return;
  }

  const generator = await getDefaultVSGenerator();
  assertEquals(generator, "Visual Studio 17 2022");
});

// Windows-specific tests
if (Deno.build.os === "windows") {
  Deno.test("detectInstalledVSVersions should detect installed versions on Windows", async () => {
    const versions = await detectInstalledVSVersions();

    // Should return an array (may be empty if no VS installed)
    assertEquals(Array.isArray(versions), true);

    // If versions are found, validate structure
    for (const version of versions) {
      assertExists(version.year);
      assertExists(version.version);
      assertExists(version.generator);
      assertExists(version.path);
      assertEquals(isValidVSVersion(version.year), true);
    }
  });

  Deno.test("getLatestVSVersion should return latest VS on Windows", async () => {
    const latest = await getLatestVSVersion();

    // May be null if no VS installed
    if (latest !== null) {
      assertExists(latest.year);
      assertExists(latest.version);
      assertExists(latest.generator);
      assertEquals(isValidVSVersion(latest.year), true);
    }
  });
}
