# Deno JUCE Project Generator

Generate JUCE audio plugin projects with a single Deno URL command.

[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://cocotone.github.io/deno-juce-project-generator/)
[![License: BSD 3-Clause](https://img.shields.io/badge/License-BSD3-yellow.svg)](https://opensource.org/license/bsd-3-clause)

## Motivation

Audio plugin development with JUCE traditionally requires several setup steps: downloading JUCE, configuring CMake, setting up project structures, and writing boilerplate code. This can be a significant barrier for beginners who want to start learning plugin development.

**This project aims to lower that barrier.**

With a single command, you can generate a complete, ready-to-build JUCE audio plugin project. No manual setup, no configuration headaches - just run one command and start coding your plugin immediately.

Our goal is to make audio plugin development more accessible to everyone, from students learning DSP to experienced developers prototyping new ideas.

## JUCE License Notice

**Important:** [JUCE](https://juce.com/) is a commercial/open-source framework owned by Raw Material Software Limited.

When using this generator, you must comply with JUCE's licensing terms:

- **Starter/Educational use**: JUCE can be used for free under the [JUCE Starter license](https://juce.com/legal/juce-8-licence/)
- **Commercial use**: Requires a commercial license from JUCE
- **Open Source**: Available under AGPLv3 for open-source projects

Please review the [JUCE License](https://juce.com/legal/juce-8-licence/) before distributing any plugins created with this generator.

This generator clones JUCE from [https://github.com/juce-framework/JUCE](https://github.com/juce-framework/JUCE) during project generation. The JUCE framework itself is not included in this repository.

## Quick Start

### Prerequisites

- [Deno](https://deno.land/) v1.40+
- [CMake](https://cmake.org/) 3.22+
- [Git](https://git-scm.com/)
- C++ Compiler:
  - Windows: Visual Studio 2022
  - macOS: Xcode Command Line Tools
  - Linux: GCC 8+ or Clang 8+

### Generate a Plugin Project

```bash
deno run --allow-read --allow-write --allow-run --allow-net --allow-env \
  https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \
  --name "MyAudioPlugin" \
  --author "Your Name" \
  --output ./my-audio-plugin \
  --with-git
```

Or with short flags:

```bash
deno run -A \
  https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \
  -n "MyAudioPlugin" -a "Your Name" -o ./my-audio-plugin --with-git
```

### Build and Run

```bash
cd my-audio-plugin
deno task build    # Build in Release mode
deno task run      # Run the Standalone app
```

## Command Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--name` | `-n` | `MyPlugin` | Plugin name |
| `--author` | `-a` | `Your Name` | Author/Company name |
| `--version` | `-v` | `0.0.1` | Plugin version |
| `--output` | `-o` | (plugin name) | Output directory |
| `--manufacturer-code` | | `Manu` | 4-char manufacturer code |
| `--plugin-code` | | `Plug` | 4-char plugin code |
| `--juce-tag` | | `master` | JUCE git tag/branch |
| `--with-git` | | `false` | Initialize git repository |
| `--help` | `-h` | | Show help |

## Generated Project Structure

```
<plugin-name>/
├── CMakeLists.txt          # CMake configuration
├── deno.json               # Deno tasks
├── build.ts                # Build script
├── build.config.ts         # Build configuration
├── cmake-file-api.ts       # CMake File API integration
├── cmake-types.ts          # TypeScript types
├── .gitignore
├── External/
│   └── JUCE/               # JUCE framework (auto-cloned)
└── Source/
    ├── PluginProcessor.h
    ├── PluginProcessor.cpp
    ├── PluginEditor.h
    └── PluginEditor.cpp
```

## Available Build Tasks

| Task | Description |
|------|-------------|
| `deno task build` | Build in Release mode |
| `deno task build:debug` | Build in Debug mode |
| `deno task clean` | Clean build directory |
| `deno task rebuild` | Clean and rebuild |
| `deno task run` | Build and run Standalone |
| `deno task run:debug` | Build and run Standalone (Debug) |
| `deno task format` | Format TypeScript files |
| `deno task lint` | Lint TypeScript files |

## Generated Plugin Formats

- **VST3** - Windows, macOS, Linux
- **AU (Audio Unit)** - macOS only
- **Standalone** - All platforms

## Specifying JUCE Version

By default, the generator clones the `master` branch. To use a specific version:

```bash
deno run -A \
  https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \
  --name "MyPlugin" \
  --juce-tag "7.0.9"
```

## Documentation

Full documentation is available at: https://cocotone.github.io/deno-juce-project-generator/

## Technologies

- [JUCE](https://juce.com/) - Cross-platform C++ framework for audio applications
- [Deno](https://deno.land/) - Secure TypeScript/JavaScript runtime
- [dax](https://jsr.io/@david/dax) - Cross-platform shell tools for Deno
- [CMake](https://cmake.org/) - Cross-platform build system

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Note:** The JUCE framework has its own licensing terms. Please review the [JUCE License](https://juce.com/legal/juce-8-licence/) for your use case.

---

# Deno JUCE Project Generator (日本語)

Deno URLコマンド一つでJUCEオーディオプラグインプロジェクトを生成します。

## モチベーション

JUCEを使ったオーディオプラグイン開発には、従来いくつかのセットアップ手順が必要でした：JUCEのダウンロード、CMakeの設定、プロジェクト構造の作成、ボイラープレートコードの記述など。これらは、プラグイン開発を学び始めたい初心者にとって大きな障壁となっていました。

**このプロジェクトは、その障壁を下げることを目指しています。**

たった一つのコマンドで、ビルド可能な完全なJUCEオーディオプラグインプロジェクトを生成できます。コードを書き始めるまでのセットアップに掛かる時間を短縮し、コマンドを実行するだけですぐにプラグインのコーディングを始められます。

私たちの目標は、DSPを学ぶ学生から新しいアイデアをプロトタイピングする経験豊富な開発者まで、すべての人にオーディオプラグイン開発をより身近なものにすることです。

## JUCEライセンスに関する注意

**重要:** [JUCE](https://juce.com/) は Raw Material Software Limited が所有する商用/オープンソースフレームワークです。

このジェネレータを使用する際は、JUCEのライセンス条項を遵守する必要があります：

- **個人/教育目的**: [JUCE Starter license](https://juce.com/legal/juce-8-licence/) の下で無料で使用可能
- **商用利用**: JUCEの商用ライセンスが必要
- **オープンソース**: オープンソースプロジェクト向けにAGPLv3で利用可能

このジェネレータで作成したプラグインを配布する前に、[JUCEライセンス](https://juce.com/legal/juce-8-licence/) を確認してください。

このジェネレータはプロジェクト生成時に [https://github.com/juce-framework/JUCE](https://github.com/juce-framework/JUCE) からJUCEをクローンします。JUCEフレームワーク自体はこのリポジトリには含まれていません。

## クイックスタート

### 前提条件

- [Deno](https://deno.land/) v1.40以上
- [CMake](https://cmake.org/) 3.22以上
- [Git](https://git-scm.com/)
- C++コンパイラ:
  - Windows: Visual Studio 2022
  - macOS: Xcode Command Line Tools
  - Linux: GCC 8+ または Clang 8+

### プラグインプロジェクトを生成

```bash
deno run --allow-read --allow-write --allow-run --allow-net --allow-env \
  https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \
  --name "MyAudioPlugin" \
  --author "Your Name" \
  --output ./my-audio-plugin \
  --with-git
```

### ビルドと実行

```bash
cd my-audio-plugin
deno task build    # Releaseモードでビルド
deno task run      # Standaloneアプリを実行
```

## ドキュメント

完全なドキュメントはこちら: https://cocotone.github.io/deno-juce-project-generator/

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

**注意:** JUCEフレームワークには独自のライセンス条項があります。ご利用のケースに応じて [JUCEライセンス](https://juce.com/legal/juce-8-licence/) を確認してください。
