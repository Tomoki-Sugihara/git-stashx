#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

import { parseArgs } from "@std/cli/parse-args";
import { saveBackup } from "./src/commands/save.ts";
import { restoreBackup } from "./src/commands/restore.ts";
import { listBackups } from "./src/commands/list.ts";

const VERSION = "1.0.0";

function printHelp(): void {
  console.log(`git-backup v${VERSION}

Usage:
  git-backup <command> [options]

Commands:
  save [description]    Create a backup of the current working state
  restore [backup-name] Restore a backup (interactive if name not provided)
  list                  List all available backups
  help                  Show this help message
  version               Show version

Examples:
  git-backup save "WIP: implementing new feature"
  git-backup restore
  git-backup restore backup/2024-01-01-12-00-00
  git-backup list
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
    console.log(`git-backup v${VERSION}`);
    Deno.exit(0);
  }

  const command = args._[0]?.toString();

  try {
    switch (command) {
      case "save": {
        const description = args._[1]?.toString();
        await saveBackup(description);
        break;
      }
      case "restore": {
        const backupName = args._[1]?.toString();
        await restoreBackup(backupName);
        break;
      }
      case "list": {
        await listBackups();
        break;
      }
      case "help": {
        printHelp();
        break;
      }
      case "version": {
        console.log(`git-backup v${VERSION}`);
        break;
      }
      default: {
        console.error(`Unknown command: ${command}`);
        console.error("Run 'git-backup help' for usage information");
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
