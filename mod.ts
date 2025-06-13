#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

import { parseArgs } from "@std/cli/parse-args";
import { saveStash } from "./src/commands/save.ts";
import { restoreStash } from "./src/commands/restore.ts";
import { listStashs } from "./src/commands/list.ts";

const VERSION = "1.0.0";

function printHelp(): void {
  console.log(`git-stashx v${VERSION}

Usage:
  git-stashx <command> [options]

Commands:
  save [description]    Create a stash of the current working state
  restore [stash-name] Restore a stash (interactive if name not provided)
  list                  List all available stashs
  help                  Show this help message
  version               Show version

Examples:
  git-stashx save "WIP: implementing new feature"
  git-stashx restore
  git-stashx restore stashx/2024-01-01-12-00-00
  git-stashx list
`);
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["help", "version"],
    alias: { h: "help", v: "version" },
  });

  if (args.help || args._.length === 0) {
    printHelp();
    Deno.exit(0);
  }

  if (args.version) {
    console.log(`git-stashx v${VERSION}`);
    Deno.exit(0);
  }

  const command = args._[0]?.toString();

  try {
    switch (command) {
      case "save": {
        const description = args._[1]?.toString();
        await saveStash(description);
        break;
      }
      case "restore": {
        const stashName = args._[1]?.toString();
        await restoreStash(stashName);
        break;
      }
      case "list": {
        await listStashs();
        break;
      }
      case "help": {
        printHelp();
        break;
      }
      case "version": {
        console.log(`git-stashx v${VERSION}`);
        break;
      }
      default: {
        console.error(`Unknown command: ${command}`);
        console.error("Run 'git-stashx help' for usage information");
        Deno.exit(1);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
