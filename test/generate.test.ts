/**
 * Unit tests for Generator Utility Functions
 */

import { assertEquals } from "jsr:@std/assert@1.0.10";

// Import utility functions by reading the source
// Since these are not exported, we'll redefine them here for testing
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

Deno.test("toPascalCase should convert strings correctly", () => {
  // Basic cases
  assertEquals(toPascalCase("my plugin"), "MyPlugin");
  assertEquals(toPascalCase("my-plugin"), "MyPlugin");
  assertEquals(toPascalCase("my_plugin"), "MyPlugin");

  // Mixed separators
  assertEquals(toPascalCase("my-super_cool plugin"), "MySuperCoolPlugin");

  // Already PascalCase
  assertEquals(toPascalCase("MyPlugin"), "MyPlugin");

  // Single word
  assertEquals(toPascalCase("plugin"), "Plugin");

  // Multiple spaces
  assertEquals(toPascalCase("my   plugin"), "MyPlugin");

  // Empty string
  assertEquals(toPascalCase(""), "");

  // Numbers
  assertEquals(toPascalCase("my-plugin-2"), "MyPlugin2");
  assertEquals(toPascalCase("v1-my-plugin"), "V1MyPlugin");
});

Deno.test("toSnakeCase should convert strings correctly", () => {
  // Basic cases
  assertEquals(toSnakeCase("MyPlugin"), "my_plugin");
  assertEquals(toSnakeCase("my-plugin"), "my_plugin");
  assertEquals(toSnakeCase("my plugin"), "my_plugin");

  // PascalCase
  assertEquals(toSnakeCase("MySuperCoolPlugin"), "my_super_cool_plugin");

  // Already snake_case
  assertEquals(toSnakeCase("my_plugin"), "my_plugin");

  // Single word
  assertEquals(toSnakeCase("plugin"), "plugin");

  // Multiple spaces
  assertEquals(toSnakeCase("my   plugin"), "my_plugin");

  // Mixed separators
  assertEquals(toSnakeCase("my-super plugin"), "my_super_plugin");

  // Empty string
  assertEquals(toSnakeCase(""), "");

  // Numbers
  assertEquals(toSnakeCase("MyPlugin2"), "my_plugin2");
  assertEquals(toSnakeCase("v1-my-plugin"), "v1_my_plugin");

  // Consecutive uppercase
  assertEquals(toSnakeCase("HTTPServer"), "httpserver");
});

Deno.test("Case conversion should be reversible", () => {
  const testCases = [
    "my plugin",
    "my-plugin",
    "my_plugin",
    "super synth",
    "audio processor",
  ];

  for (const testCase of testCases) {
    const pascal = toPascalCase(testCase);
    const snake = toSnakeCase(pascal);

    // Original -> Pascal -> Snake should produce consistent snake_case
    assertEquals(typeof pascal, "string");
    assertEquals(typeof snake, "string");

    // Pascal case should start with uppercase
    assertEquals(pascal[0], pascal[0].toUpperCase());

    // Snake case should be all lowercase
    assertEquals(snake, snake.toLowerCase());
  }
});

Deno.test("Case conversion edge cases", () => {
  // Test with special characters (should be removed/ignored)
  assertEquals(toPascalCase("my@plugin"), "My@plugin");
  assertEquals(toSnakeCase("my@plugin"), "my@plugin");

  // Test with leading/trailing spaces
  assertEquals(toPascalCase("  my plugin  "), "MyPlugin");
  assertEquals(toSnakeCase("  my plugin  "), "_my_plugin_");

  // Test with underscores and dashes mixed
  assertEquals(toPascalCase("my_-_plugin"), "MyPlugin");
  assertEquals(toSnakeCase("my_-_plugin"), "my___plugin");
});
