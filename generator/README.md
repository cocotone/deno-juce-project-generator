# JUCE Audio Plugin Project Generator

A Deno-based project generator that creates JUCE audio plugin projects locally by running from a remote URL.
JUCE framework is automatically cloned from GitHub during project generation.

## Usage

### Running from Remote URL

Once hosted on GitHub, you can generate a project with the following command:

```bash
# Basic usage
deno run --allow-read --allow-write --allow-run --allow-net \
  https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts

# With options
deno run --allow-read --allow-write --allow-run --allow-net \
  https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \
  --name "MySynth" \
  --author "Cocotone" \
  --version "1.0.0" \
  --output ./my-synth \
  --manufacturer-code "Coco" \
  --plugin-code "Msyn" \
  --with-git
```

### Running Locally

```bash
cd generator
deno run --allow-read --allow-write --allow-run --allow-net generate.ts --name "TestPlugin"
```

## Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--name` | `-n` | `MyPlugin` | Plugin name |
| `--author` | `-a` | `Your Name` | Author/Company name |
| `--version` | `-v` | `0.0.1` | Version |
| `--output` | `-o` | (plugin name) | Output directory |
| `--manufacturer-code` | - | `Manu` | 4-char manufacturer code |
| `--plugin-code` | - | `Plug` | 4-char plugin code |
| `--juce-tag` | - | `master` | JUCE git tag/branch |
| `--with-git` | - | false | Initialize git repository |
| `--help` | `-h` | - | Show help |

## Generated Project Structure

```
<plugin-name>/
├── CMakeLists.txt          # CMake configuration for JUCE plugin
├── deno.json               # Deno task configuration
├── build.ts                # Build script (TypeScript/Deno)
├── build.config.ts         # Build configuration
├── cmake-file-api.ts       # CMake File API integration
├── cmake-types.ts          # TypeScript type definitions
├── .gitignore
├── External/
│   └── JUCE/               # JUCE framework (git cloned)
└── Source/
    ├── PluginProcessor.h   # Audio processor header
    ├── PluginProcessor.cpp # Audio processor implementation
    ├── PluginEditor.h      # Plugin editor (GUI) header
    └── PluginEditor.cpp    # Plugin editor implementation
```

## Post-Generation Workflow

```bash
cd <plugin-name>

# Build
deno task build              # Build in Release mode
deno task build:debug        # Build in Debug mode

# Clean
deno task clean              # Remove build directory
deno task rebuild            # Clean and rebuild

# Format & Lint
deno task format             # Format TypeScript files
deno task lint               # Run linter
```

## Generated Plugin Formats

The generator creates plugins in the following formats:
- **AU (Audio Unit)** - macOS only
- **VST3** - Windows, macOS, Linux
- **Standalone** - All platforms

Plugin artifacts are located in:
```
build/<PluginName>_artefacts/<Configuration>/
```

## Requirements

- [Deno](https://deno.land/) v1.40 or later
- [CMake](https://cmake.org/) 3.22 or later
- [Git](https://git-scm.com/) (for cloning JUCE)
- C++17 compatible compiler:
  - **Windows**: Visual Studio 2022
  - **macOS**: Xcode Command Line Tools
  - **Linux**: GCC 8+ or Clang 8+

## JUCE Version

By default, the generator clones the `master` branch of JUCE. You can specify a specific version:

```bash
# Use a specific JUCE version
deno run --allow-read --allow-write --allow-run --allow-net generate.ts \
  --name "MyPlugin" \
  --juce-tag "7.0.9"
```

## Customization

After generation, you can customize your plugin:

1. **CMakeLists.txt**: Add JUCE modules, configure plugin properties
2. **build.config.ts**: Modify project metadata
3. **Source/**: Implement your audio processing and GUI

### Common JUCE Plugin Properties

Edit `CMakeLists.txt` to configure:
- `IS_SYNTH` - Set to TRUE for synthesizers
- `NEEDS_MIDI_INPUT` - Enable MIDI input
- `NEEDS_MIDI_OUTPUT` - Enable MIDI output
- `FORMATS` - Add/remove plugin formats (AU, VST3, AAX, etc.)

## License

BSD 3-Clause License

---

# JUCE オーディオプラグイン プロジェクトジェネレーター (日本語)

Denoを使用してリモートURLからJUCEオーディオプラグインプロジェクトを生成するジェネレーターです。
JUCEフレームワークはプロジェクト生成時にGitHubから自動的にクローンされます。

## 使い方

### リモートURLからの実行

GitHubにホストした場合、以下のコマンドでプロジェクトを生成できます：

```bash
# 基本的な使用方法
deno run --allow-read --allow-write --allow-run --allow-net \
  https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts

# オプション付き
deno run --allow-read --allow-write --allow-run --allow-net \
  https://raw.githubusercontent.com/cocotone/deno-juce-project-generator/main/generator/generate.ts \
  --name "MySynth" \
  --author "Cocotone" \
  --version "1.0.0" \
  --output ./my-synth \
  --manufacturer-code "Coco" \
  --plugin-code "Msyn" \
  --with-git
```

### ローカルでの実行

```bash
cd generator
deno run --allow-read --allow-write --allow-run --allow-net generate.ts --name "TestPlugin"
```

## オプション

| オプション | 短縮形 | デフォルト | 説明 |
|-----------|--------|-----------|------|
| `--name` | `-n` | `MyPlugin` | プラグイン名 |
| `--author` | `-a` | `Your Name` | 作者/会社名 |
| `--version` | `-v` | `0.0.1` | バージョン |
| `--output` | `-o` | (プラグイン名) | 出力ディレクトリ |
| `--manufacturer-code` | - | `Manu` | 4文字のメーカーコード |
| `--plugin-code` | - | `Plug` | 4文字のプラグインコード |
| `--juce-tag` | - | `master` | JUCEのgitタグ/ブランチ |
| `--with-git` | - | false | Gitリポジトリを初期化 |
| `--help` | `-h` | - | ヘルプを表示 |

## 生成されるプロジェクト構造

```
<plugin-name>/
├── CMakeLists.txt          # JUCEプラグイン用CMake設定
├── deno.json               # Denoタスク設定
├── build.ts                # ビルドスクリプト (TypeScript/Deno)
├── build.config.ts         # ビルド設定
├── cmake-file-api.ts       # CMake File API統合
├── cmake-types.ts          # TypeScript型定義
├── .gitignore
├── External/
│   └── JUCE/               # JUCEフレームワーク (git clone)
└── Source/
    ├── PluginProcessor.h   # オーディオプロセッサヘッダー
    ├── PluginProcessor.cpp # オーディオプロセッサ実装
    ├── PluginEditor.h      # プラグインエディタ (GUI) ヘッダー
    └── PluginEditor.cpp    # プラグインエディタ実装
```

## 生成後のワークフロー

```bash
cd <plugin-name>

# ビルド
deno task build              # Releaseモードでビルド
deno task build:debug        # Debugモードでビルド

# クリーン
deno task clean              # ビルドディレクトリを削除
deno task rebuild            # クリーンして再ビルド

# フォーマット＆リント
deno task format             # TypeScriptファイルをフォーマット
deno task lint               # リント検査
```

## 生成されるプラグインフォーマット

以下のフォーマットでプラグインが生成されます：
- **AU (Audio Unit)** - macOSのみ
- **VST3** - Windows, macOS, Linux
- **Standalone** - 全プラットフォーム

プラグインの成果物は以下に配置されます：
```
build/<PluginName>_artefacts/<Configuration>/
```

## 必要条件

- [Deno](https://deno.land/) v1.40以上
- [CMake](https://cmake.org/) 3.22以上
- [Git](https://git-scm.com/) (JUCEのクローン用)
- C++17対応コンパイラ:
  - **Windows**: Visual Studio 2022
  - **macOS**: Xcode Command Line Tools
  - **Linux**: GCC 8+ または Clang 8+

## JUCEバージョン

デフォルトでは、JUCEの`master`ブランチがクローンされます。特定のバージョンを指定することもできます：

```bash
# 特定のJUCEバージョンを使用
deno run --allow-read --allow-write --allow-run --allow-net generate.ts \
  --name "MyPlugin" \
  --juce-tag "7.0.9"
```

## カスタマイズ

生成後、以下をカスタマイズできます：

1. **CMakeLists.txt**: JUCEモジュールの追加、プラグインプロパティの設定
2. **build.config.ts**: プロジェクトメタデータの変更
3. **Source/**: オーディオ処理とGUIの実装

### 一般的なJUCEプラグインプロパティ

`CMakeLists.txt`で以下を設定できます：
- `IS_SYNTH` - シンセサイザーの場合はTRUE
- `NEEDS_MIDI_INPUT` - MIDI入力を有効化
- `NEEDS_MIDI_OUTPUT` - MIDI出力を有効化
- `FORMATS` - プラグインフォーマットの追加/削除 (AU, VST3, AAX等)

## ライセンス

BSD 3-Clause License
