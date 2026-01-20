/**
 * Unit tests for Template Generators
 */

import { assertEquals, assertExists, assertStringIncludes } from "jsr:@std/assert@1.0.10";
import {
  generateJuceCMakeLists,
  generateJuceDenoJson,
  generateJuceBuildScript,
  generateJuceBuildConfig,
  generateJuceCMakeFileAPI,
  generateJuceCMakeTypes,
  generateVSDetector,
  generateJuceGitignore,
  generatePluginProcessorH,
  generatePluginProcessorCpp,
  generatePluginEditorH,
  generatePluginEditorCpp,
} from "../generator/juce-templates.ts";
import type { JucePluginConfig } from "../generator/generate.ts";

// Sample config for testing
const sampleConfig: JucePluginConfig = {
  name: "TestPlugin",
  namePascal: "TestPlugin",
  nameSnake: "test_plugin",
  nameUpper: "TEST_PLUGIN",
  author: "Test Author",
  version: "1.0.0",
  outputDir: "./test-plugin",
  manufacturerCode: "Test",
  pluginCode: "Tplu",
  withGit: true,
  juceTag: "master",
  vsVersion: "2022",
};

Deno.test("generateJuceCMakeLists should include project configuration", () => {
  const content = generateJuceCMakeLists(sampleConfig);

  assertExists(content);
  assertStringIncludes(content, "cmake_minimum_required");
  assertStringIncludes(content, `project(${sampleConfig.nameUpper}`);
  assertStringIncludes(content, `VERSION ${sampleConfig.version}`);
  assertStringIncludes(content, "add_subdirectory(External/JUCE)");
  assertStringIncludes(content, `juce_add_plugin(${sampleConfig.namePascal}`);
  assertStringIncludes(content, `COMPANY_NAME "${sampleConfig.author}"`);
  assertStringIncludes(content, `PLUGIN_MANUFACTURER_CODE ${sampleConfig.manufacturerCode}`);
  assertStringIncludes(content, `PLUGIN_CODE ${sampleConfig.pluginCode}`);
  assertStringIncludes(content, "FORMATS AU VST3 Standalone");
});

Deno.test("generateJuceDenoJson should include tasks", () => {
  const content = generateJuceDenoJson();

  assertExists(content);

  // Parse JSON to verify structure
  const json = JSON.parse(content);

  assertExists(json.tasks);
  assertExists(json.tasks.build);
  assertExists(json.tasks["build:debug"]);
  assertExists(json.tasks["build:release"]);
  assertExists(json.tasks.clean);
  assertExists(json.tasks.rebuild);
  assertExists(json.tasks.run);
  assertExists(json.tasks["run:debug"]);
  assertExists(json.tasks.format);
  assertExists(json.tasks.lint);

  assertExists(json.fmt);
  assertExists(json.lint);
});

Deno.test("generateJuceBuildConfig should include config values", () => {
  const content = generateJuceBuildConfig(sampleConfig);

  assertExists(content);
  assertStringIncludes(content, "export interface BuildConfig");
  assertStringIncludes(content, `projectName: "${sampleConfig.nameUpper}"`);
  assertStringIncludes(content, `pluginName: "${sampleConfig.namePascal}"`);
  assertStringIncludes(content, `version: "${sampleConfig.version}"`);
  assertStringIncludes(content, `author: "${sampleConfig.author}"`);
  assertStringIncludes(content, `vsVersion: "${sampleConfig.vsVersion}"`);
});

Deno.test("generateJuceBuildConfig should handle missing vsVersion", () => {
  const configWithoutVS: JucePluginConfig = {
    ...sampleConfig,
    vsVersion: undefined,
  };

  const content = generateJuceBuildConfig(configWithoutVS);

  assertExists(content);
  assertEquals(content.includes("vsVersion:"), false);
});

Deno.test("generateJuceBuildScript should include build logic", () => {
  const content = generateJuceBuildScript();

  assertExists(content);
  assertStringIncludes(content, "#!/usr/bin/env -S deno run --allow-all");
  assertStringIncludes(content, "import $ from");
  assertStringIncludes(content, "parseArgs");
  assertStringIncludes(content, "async function configure()");
  assertStringIncludes(content, "async function build()");
  assertStringIncludes(content, "async function clean()");
  assertStringIncludes(content, "getDefaultVSGenerator");
});

Deno.test("generateJuceCMakeFileAPI should include File API logic", () => {
  const content = generateJuceCMakeFileAPI();

  assertExists(content);
  assertStringIncludes(content, "export async function setupFileAPI");
  assertStringIncludes(content, "export async function parseFileAPI");
  assertStringIncludes(content, "export function printArtifacts");
  assertStringIncludes(content, '".cmake"');
  assertStringIncludes(content, '"api"');
  assertStringIncludes(content, '"v1"');
  assertStringIncludes(content, '"query"');
  assertStringIncludes(content, "codemodel-v2");
});

Deno.test("generateVSDetector should include VS detection logic", () => {
  const content = generateVSDetector();

  assertExists(content);
  assertStringIncludes(content, "export interface VSVersion");
  assertStringIncludes(content, "SUPPORTED_VS_VERSIONS");
  assertStringIncludes(content, "Visual Studio 18 2026");
  assertStringIncludes(content, "Visual Studio 17 2022");
  assertStringIncludes(content, "Visual Studio 16 2019");
  assertStringIncludes(content, "detectInstalledVSVersions");
  assertStringIncludes(content, "getDefaultVSGenerator");
});

Deno.test("generateJuceCMakeTypes should include type definitions", () => {
  const content = generateJuceCMakeTypes();

  assertExists(content);
  assertStringIncludes(content, "export interface FileAPIIndex");
  assertStringIncludes(content, "export interface CodeModelV2");
  assertStringIncludes(content, "export interface TargetInfo");
  assertStringIncludes(content, "export interface BuildArtifact");
});

Deno.test("generateJuceGitignore should include common patterns", () => {
  const content = generateJuceGitignore();

  assertExists(content);
  assertStringIncludes(content, "build/");
  assertStringIncludes(content, "External/JUCE/");
  assertStringIncludes(content, ".vscode/");
  assertStringIncludes(content, ".DS_Store");
  assertStringIncludes(content, "deno.lock");
  assertStringIncludes(content, "*.vst3");
  assertStringIncludes(content, "*.component");
});

Deno.test("generatePluginProcessorH should include class definition", () => {
  const content = generatePluginProcessorH(sampleConfig);

  assertExists(content);
  assertStringIncludes(content, "#pragma once");
  assertStringIncludes(content, "#include <juce_audio_processors/juce_audio_processors.h>");
  assertStringIncludes(content, `class ${sampleConfig.namePascal}AudioProcessor`);
  assertStringIncludes(content, "public juce::AudioProcessor");
  assertStringIncludes(content, "void prepareToPlay");
  assertStringIncludes(content, "void processBlock");
  assertStringIncludes(content, "juce::AudioProcessorEditor* createEditor()");
  assertStringIncludes(content, "JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR");
});

Deno.test("generatePluginProcessorCpp should include implementation", () => {
  const content = generatePluginProcessorCpp(sampleConfig);

  assertExists(content);
  assertStringIncludes(content, '#include "PluginProcessor.h"');
  assertStringIncludes(content, '#include "PluginEditor.h"');
  assertStringIncludes(content, `${sampleConfig.namePascal}AudioProcessor::${sampleConfig.namePascal}AudioProcessor()`);
  assertStringIncludes(content, "prepareToPlay");
  assertStringIncludes(content, "processBlock");
  assertStringIncludes(content, "juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()");
});

Deno.test("generatePluginEditorH should include editor class", () => {
  const content = generatePluginEditorH(sampleConfig);

  assertExists(content);
  assertStringIncludes(content, "#pragma once");
  assertStringIncludes(content, '#include "PluginProcessor.h"');
  assertStringIncludes(content, `class ${sampleConfig.namePascal}AudioProcessorEditor`);
  assertStringIncludes(content, "public juce::AudioProcessorEditor");
  assertStringIncludes(content, "void paint");
  assertStringIncludes(content, "void resized()");
});

Deno.test("generatePluginEditorCpp should include editor implementation", () => {
  const content = generatePluginEditorCpp(sampleConfig);

  assertExists(content);
  assertStringIncludes(content, '#include "PluginProcessor.h"');
  assertStringIncludes(content, '#include "PluginEditor.h"');
  assertStringIncludes(content, `${sampleConfig.namePascal}AudioProcessorEditor::${sampleConfig.namePascal}AudioProcessorEditor`);
  assertStringIncludes(content, "paint");
  assertStringIncludes(content, "resized");
  assertStringIncludes(content, `"${sampleConfig.name}"`);
});

Deno.test("All template generators should return non-empty strings", () => {
  assertEquals(generateJuceCMakeLists(sampleConfig).length > 0, true);
  assertEquals(generateJuceDenoJson().length > 0, true);
  assertEquals(generateJuceBuildScript().length > 0, true);
  assertEquals(generateJuceBuildConfig(sampleConfig).length > 0, true);
  assertEquals(generateJuceCMakeFileAPI().length > 0, true);
  assertEquals(generateJuceCMakeTypes().length > 0, true);
  assertEquals(generateVSDetector().length > 0, true);
  assertEquals(generateJuceGitignore().length > 0, true);
  assertEquals(generatePluginProcessorH(sampleConfig).length > 0, true);
  assertEquals(generatePluginProcessorCpp(sampleConfig).length > 0, true);
  assertEquals(generatePluginEditorH(sampleConfig).length > 0, true);
  assertEquals(generatePluginEditorCpp(sampleConfig).length > 0, true);
});
