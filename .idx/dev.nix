# @file .idx/dev.nix
# @stamp {"ts":"2025-10-30T15:55:00Z"}
# @architectural-role Configuration
# @description Defines the Nix-based development environment for the 'Whose Turn Now' project, specifying all required packages, extensions, and lifecycle hooks for Firebase Studio.
# @core-principles
#   1. IS the single source of truth for the development environment's configuration.
#   2. MUST ensure a reproducible and consistent environment for all developers.
#   3. OWNS the definition of system packages, environment variables, and VS Code extensions.
# @api-declaration
#   - Not applicable. This is a Nix configuration file, not an importable module.
# @contract
#   assertions:
#     purity: pure # This file is declarative configuration.
#     state_ownership: none
#     external_io: https_apis # Fetches packages from Nix channels.

{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.pnpm
  ];
  env = {};
  idx = {
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
      "dbaeumer.vscode-eslint"
    ];
    previews = {
      enable = true;
      previews = {
        web = {
          # Use the robust 'sh -c' pattern to execute the command string
          command = [ "sh" "-c" "pnpm run dev -- --host 0.0.0.0" ];
          manager = "web";
        };
      };
    };
    workspace = {
      onCreate = {
        # This command is just a string, so it's fine as is.
        install-deps = "pnpm install";
      };
      onStart = {};
    };
  };
}