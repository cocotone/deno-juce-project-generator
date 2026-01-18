# C++/CMake Project Generator

A project generator that creates C++/CMake projects locally by running from a remote Deno URL.

## Usage

### Running from Remote URL

Once hosted on GitHub, you can generate a project with the following command:

```bash
# Basic usage
deno run --allow-read --allow-write --allow-run \
  https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/generator/generate.ts

# With options
deno run --allow-read --allow-write --allow-run \
  https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/generator/generate.ts \
  --name "MyProject" \
  --author "Your Name" \
  --version "1.0.0" \
  --output ./my-project \
  --with-git
```

### Running Locally

```bash
cd generator
deno run --allow-read --allow-write --allow-run generate.ts --name "TestProject"
```

## Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--name` | `-n` | `MyApp` | Project name |
| `--author` | `-a` | `Your Name` | Author name |
| `--version` | `-v` | `1.0.0` | Version |
| `--output` | `-o` | (project name) | Output directory |
| `--with-git` | - | false | Initialize git repository |
| `--help` | `-h` | - | Show help |

## Generated Project Structure

```
<project-name>/
├── CMakeLists.txt          # CMake configuration
├── deno.json               # Deno task configuration
├── build.ts                # Build script
├── build.config.ts         # Build configuration
├── cmake-file-api.ts       # CMake File API integration
├── cmake-types.ts          # TypeScript type definitions
├── .gitignore
└── src/
    ├── main.cpp            # Main entry point
    ├── core/
    │   ├── core.h          # Static library header
    │   └── core.cpp        # Static library implementation
    └── utils/
        ├── utils.h         # Shared library header
        └── utils.cpp       # Shared library implementation
```

## Post-Generation Workflow

```bash
cd <project-name>

# Build
deno task build              # Build in Release mode
deno task build:debug        # Build in Debug mode

# Clean
deno task clean              # Remove build directory
deno task rebuild            # Clean and rebuild

# Test
deno task test               # Build and run executable

# Format & Lint
deno task format             # Format TypeScript files
deno task lint               # Run linter
```

## Requirements

- [Deno](https://deno.land/) v1.40 or later
- [CMake](https://cmake.org/) 3.15 or later
- C++17 compatible compiler
  - Windows: Visual Studio 2022
  - macOS: Xcode Command Line Tools
  - Linux: GCC 8+ or Clang 8+

## Customization

The generated project can be customized as follows:

1. **CMakeLists.txt**: Add libraries, configure dependencies
2. **build.config.ts**: Modify project metadata
3. **src/**: Add or modify C++ source code

## Hosting on GitHub Raw

1. Fork or clone this repository
2. Push the `generator/` directory to GitHub
3. Access using the Raw URL:
   ```
   https://raw.githubusercontent.com/<user>/<repo>/<branch>/generator/generate.ts
   ```

## License

MIT License

---

# C++/CMake プロジェクトジェネレーター (日本語)

Deno URL実行でリモートからC++/CMakeプロジェクトをローカルに生成するジェネレーターです。

## 使い方

### リモートURLからの実行

GitHubにホストした場合、以下のコマンドでプロジェクトを生成できます：

```bash
# 基本的な使用方法
deno run --allow-read --allow-write --allow-run \
  https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/generator/generate.ts

# オプション付き
deno run --allow-read --allow-write --allow-run \
  https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/generator/generate.ts \
  --name "MyProject" \
  --author "Your Name" \
  --version "1.0.0" \
  --output ./my-project \
  --with-git
```

### ローカルでの実行

```bash
cd generator
deno run --allow-read --allow-write --allow-run generate.ts --name "TestProject"
```

## オプション

| オプション | 短縮形 | デフォルト | 説明 |
|-----------|--------|-----------|------|
| `--name` | `-n` | `MyApp` | プロジェクト名 |
| `--author` | `-a` | `Your Name` | 作者名 |
| `--version` | `-v` | `1.0.0` | バージョン |
| `--output` | `-o` | (プロジェクト名) | 出力ディレクトリ |
| `--with-git` | - | false | Gitリポジトリを初期化 |
| `--help` | `-h` | - | ヘルプを表示 |

## 生成されるプロジェクト構造

```
<project-name>/
├── CMakeLists.txt          # CMake設定
├── deno.json               # Denoタスク設定
├── build.ts                # ビルドスクリプト
├── build.config.ts         # ビルド設定
├── cmake-file-api.ts       # CMake File API統合
├── cmake-types.ts          # TypeScript型定義
├── .gitignore
└── src/
    ├── main.cpp            # メインエントリーポイント
    ├── core/
    │   ├── core.h          # 静的ライブラリヘッダー
    │   └── core.cpp        # 静的ライブラリ実装
    └── utils/
        ├── utils.h         # 動的ライブラリヘッダー
        └── utils.cpp       # 動的ライブラリ実装
```

## 生成後のワークフロー

```bash
cd <project-name>

# ビルド
deno task build              # Releaseモードでビルド
deno task build:debug        # Debugモードでビルド

# クリーン
deno task clean              # ビルドディレクトリを削除
deno task rebuild            # クリーンして再ビルド

# テスト
deno task test               # ビルドして実行ファイルを実行

# フォーマット＆リント
deno task format             # TypeScriptファイルをフォーマット
deno task lint               # リント検査
```

## 必要条件

- [Deno](https://deno.land/) v1.40以上
- [CMake](https://cmake.org/) 3.15以上
- C++17対応コンパイラ
  - Windows: Visual Studio 2022
  - macOS: Xcode Command Line Tools
  - Linux: GCC 8+ または Clang 8+

## カスタマイズ

生成されたプロジェクトは以下のようにカスタマイズできます：

1. **CMakeLists.txt**: ライブラリの追加、依存関係の設定
2. **build.config.ts**: プロジェクトメタデータの変更
3. **src/**: C++ソースコードの追加・変更

## GitHub Rawでのホスティング

1. このリポジトリをフォークまたはクローン
2. `generator/` ディレクトリをGitHubにプッシュ
3. Raw URLを使用してアクセス：
   ```
   https://raw.githubusercontent.com/<user>/<repo>/<branch>/generator/generate.ts
   ```

## ライセンス

MIT License
