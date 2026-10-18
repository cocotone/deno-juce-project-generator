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
  generateJuceGitignore,
  generatePluginProcessorH,
  generatePluginProcessorCpp,
  generatePluginEditorH,
  generatePluginEditorCpp,
  generateGuiAppMainCpp,
  generateMainComponentH,
  generateMainComponentCpp,
  generateConsoleAppMainCpp,
} from "../generator/juce-templates.ts";
import type { JuceProjectConfig } from "../generator/generate.ts";

// Sample config for testing
const sampleConfig: JuceProjectConfig = {
  projectType: "plugin",
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
  assertStringIncludes(content, `projectType: "plugin"`);
  assertStringIncludes(content, `targetName: "${sampleConfig.namePascal}"`);
  assertStringIncludes(content, `productName: "${sampleConfig.name}"`);
  assertStringIncludes(content, `version: "${sampleConfig.version}"`);
  assertStringIncludes(content, `author: "${sampleConfig.author}"`);
  assertStringIncludes(content, `vsVersion: "${sampleConfig.vsVersion}"`);
});

Deno.test("generateJuceBuildConfig should handle missing vsVersion", () => {
  const configWithoutVS: JuceProjectConfig = {
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
  assertEquals(generateJuceGitignore().length > 0, true);
  assertEquals(generatePluginProcessorH(sampleConfig).length > 0, true);
  assertEquals(generatePluginProcessorCpp(sampleConfig).length > 0, true);
  assertEquals(generatePluginEditorH(sampleConfig).length > 0, true);
  assertEquals(generatePluginEditorCpp(sampleConfig).length > 0, true);
});

// =============================================================================
// GUI / Console application templates
// =============================================================================

const guiConfig: JuceProjectConfig = {
  ...sampleConfig,
  projectType: "gui",
  name: "Test App",
  namePascal: "TestApp",
};

const cliConfig: JuceProjectConfig = {
  ...sampleConfig,
  projectType: "cli",
  name: "Test Cli",
  namePascal: "TestCli",
};

Deno.test("generateJuceCMakeLists should use juce_add_gui_app for gui type", () => {
  const content = generateJuceCMakeLists(guiConfig);

  assertStringIncludes(content, "add_subdirectory(External/JUCE)");
  assertStringIncludes(content, `juce_add_gui_app(${guiConfig.namePascal}`);
  assertStringIncludes(content, `PRODUCT_NAME "${guiConfig.name}"`);
  assertStringIncludes(content, "Source/Main.cpp");
  assertStringIncludes(content, "Source/MainComponent.cpp");
  assertStringIncludes(content, "juce::juce_gui_extra");
  assertStringIncludes(content, "JUCE_APPLICATION_NAME_STRING");
  assertEquals(content.includes("juce_add_plugin"), false);
  assertEquals(content.includes("PLUGIN_CODE"), false);
});

Deno.test("generateJuceCMakeLists should use juce_add_console_app for cli type", () => {
  const content = generateJuceCMakeLists(cliConfig);

  assertStringIncludes(content, "add_subdirectory(External/JUCE)");
  assertStringIncludes(content, `juce_add_console_app(${cliConfig.namePascal}`);
  assertStringIncludes(content, `PRODUCT_NAME "${cliConfig.name}"`);
  assertStringIncludes(content, "Source/Main.cpp");
  assertStringIncludes(content, "juce::juce_core");
  assertEquals(content.includes("juce_add_plugin"), false);
  assertEquals(content.includes("juce_gui_extra"), false);
  assertEquals(content.includes("MainComponent"), false);
});

Deno.test("generateJuceBuildConfig should include project type", () => {
  assertStringIncludes(generateJuceBuildConfig(guiConfig), `projectType: "gui"`);
  assertStringIncludes(generateJuceBuildConfig(cliConfig), `projectType: "cli"`);
});

Deno.test("generateJuceBuildScript should resolve executables for all project types", () => {
  const content = generateJuceBuildScript();

  assertStringIncludes(content, "function getExecutablePath()");
  assertStringIncludes(content, 'case "plugin":');
  assertStringIncludes(content, 'case "gui":');
  assertStringIncludes(content, 'case "cli":');
  assertStringIncludes(content, "config.productName");
});

Deno.test("generateGuiAppMainCpp should define a JUCEApplication", () => {
  const content = generateGuiAppMainCpp(guiConfig);

  assertStringIncludes(content, '#include "MainComponent.h"');
  assertStringIncludes(content, `class ${guiConfig.namePascal}Application final : public juce::JUCEApplication`);
  assertStringIncludes(content, "class MainWindow final : public juce::DocumentWindow");
  assertStringIncludes(content, `START_JUCE_APPLICATION (${guiConfig.namePascal}Application)`);
});

Deno.test("generateMainComponent should define the main component", () => {
  const header = generateMainComponentH();
  assertStringIncludes(header, "#pragma once");
  assertStringIncludes(header, "#include <juce_gui_extra/juce_gui_extra.h>");
  assertStringIncludes(header, "class MainComponent final : public juce::Component");

  const impl = generateMainComponentCpp(guiConfig);
  assertStringIncludes(impl, '#include "MainComponent.h"');
  assertStringIncludes(impl, "MainComponent::MainComponent()");
  assertStringIncludes(impl, `"${guiConfig.name}"`);
});

Deno.test("generateConsoleAppMainCpp should define main()", () => {
  const content = generateConsoleAppMainCpp();

  assertStringIncludes(content, "#include <juce_core/juce_core.h>");
  assertStringIncludes(content, "int main (int argc, char* argv[])");
  assertStringIncludes(content, "juce::ArgumentList");
  assertStringIncludes(content, "JUCE_APPLICATION_VERSION_STRING");
});
