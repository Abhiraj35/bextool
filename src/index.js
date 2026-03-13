#!/usr/bin/env node

import * as p from "@clack/prompts";
import chalk from "chalk";
import { execa } from "execa";
import path from "path";
import { fileGenerator } from "./utils/file-generator.js";

const packageManager = "npm";
const theme = {
  primary: "#f97316",
  primaryDark: "#9a3412",
  primarySoft: "#fdba74",
};

const browserChoices = [
  { value: "chrome", label: "Chrome", hint: "Manifest V3, best default" },
  { value: "firefox", label: "Firefox", hint: "Manifest V2 compatibility" },
  { value: "edge", label: "Edge", hint: "Chromium-based" },
  { value: "safari", label: "Safari", hint: "Experimental workflow" },
];

const templateChoices = [
  { value: "popup", label: "Popup", hint: "Toolbar UI and quick actions" },
  { value: "content", label: "Content script", hint: "Inject into web pages" },
  { value: "background", label: "Background", hint: "Run extension logic only" },
  { value: "full", label: "Full starter", hint: "Popup, background, and content" },
];

const permissionChoices = [
  { value: "storage", label: "Storage", hint: "Save extension data" },
  { value: "tabs", label: "Tabs", hint: "Read and update browser tabs" },
  { value: "activeTab", label: "Active tab", hint: "Access the current tab" },
  {
    value: "webNavigation",
    label: "Web navigation",
    hint: "Observe navigation events",
  },
  { value: "bookmarks", label: "Bookmarks", hint: "Read saved bookmarks" },
  { value: "history", label: "History", hint: "Read browsing history" },
];

function handleCancel(value) {
  if (p.isCancel(value)) {
    p.cancel(chalk.yellow("Setup cancelled. No files were created."));
    process.exit(0);
  }

  return value;
}

function sectionTitle(step, title) {
  return `${chalk.bgHex(theme.primaryDark).white(` ${step} `)} ${chalk.hex(theme.primarySoft).bold(title)}`;
}

function humanizeChoice(value, choices) {
  return choices.find((choice) => choice.value === value)?.label ?? value;
}

function renderSummary(config) {
  const selectedPermissions =
    config.permissions.length > 0 ? config.permissions.join(", ") : "none";

  return [
    `${chalk.bold("Project")}      ${config.projectName}`,
    `${chalk.bold("Description")}  ${config.description || chalk.dim("none")}`,
    `${chalk.bold("Version")}      ${config.version}`,
    `${chalk.bold("Browser")}      ${humanizeChoice(config.browser, browserChoices)}`,
    `${chalk.bold("Starter")}      ${humanizeChoice(config.templateType, templateChoices)}`,
    `${chalk.bold("Permissions")}  ${selectedPermissions}`,
    `${chalk.bold("Directory")}    ${config.targetPath}`,
  ].join("\n");
}

async function main() {
  console.clear();

  p.intro(
    [
      chalk.bold.hex(theme.primary)("BEXTOOL"),
      chalk.hex(theme.primarySoft)(
        "Scaffold a browser extension with a cleaner starting point.",
      ),
    ].join("\n"),
  );

  try {
    p.note(
      [
        "Use arrow keys to move, space to select, and Ctrl+C to exit.",
        "This wizard will generate the project and can optionally install dependencies.",
		" ",
		"Here you go !",
      ].join("\n"),
      "Quick Guide",
    );

    const projectName = handleCancel(
      await p.text({
        message: sectionTitle("1", "Project name"),
        placeholder: "my-awesome-extension",
        validate(value) {
          if (!value) return "Project name is required";
          if (value.includes(" ")) return "Project name cannot contain spaces";
          return undefined;
        },
      }),
    );

    const description = handleCancel(
      await p.text({
        message: sectionTitle("2", "Description"),
        placeholder: "A browser extension that does one thing well",
      }),
    );

    const version = handleCancel(
      await p.text({
        message: sectionTitle("3", "Initial version"),
        placeholder: "1.0.0",
        initialValue: "1.0.0",
      }),
    );

    const browser = handleCancel(
      await p.select({
        message: sectionTitle("4", "Target browser"),
        options: browserChoices,
        required: true,
        initialValue: "chrome",
      }),
    );

    const templateType = handleCancel(
      await p.select({
        message: sectionTitle("5", "Starter type"),
        options: templateChoices,
        initialValue: "full",
      }),
    );

    const permissions = handleCancel(
      await p.multiselect({
        message: sectionTitle("6", "Permissions"),
        options: permissionChoices,
        required: false,
      }),
    );

    const targetPath = path.join(process.cwd(), projectName);
    const setupConfig = {
      projectName,
      description,
      version,
      browser,
      templateType,
      permissions,
      targetPath,
    };

    p.note(renderSummary(setupConfig), "Build Summary");

    const shouldCreate = handleCancel(
      await p.confirm({
        message: "Create this extension scaffold?",
        initialValue: true,
      }),
    );

    if (!shouldCreate) {
      p.cancel(chalk.yellow("Setup cancelled before file generation."));
      process.exit(0);
    }

    const spinner = p.spinner();
    spinner.start("Generating project files");

    await fileGenerator.generate(setupConfig);

    spinner.stop("Project files created");

    const installDeps = handleCancel(
      await p.confirm({
        message: "Install dependencies now?",
        initialValue: true,
      }),
    );

    if (installDeps) {
      spinner.start(`Installing dependencies with ${packageManager}`);

      try {
        process.chdir(targetPath);
        await execa(packageManager, ["install"]);
        spinner.stop("Dependencies installed");
      } catch (error) {
        spinner.stop("Dependency installation failed");
        p.note(
          `Run ${packageManager} install inside ${projectName} when you're ready.`,
          "Manual Step",
        );
      }
    }

    p.outro(chalk.hex(theme.primary)("Extension scaffold ready."));

    p.note(
      [
        `${chalk.hex(theme.primarySoft)(`cd ${projectName}`)}`,
        !installDeps
          ? `${chalk.hex(theme.primarySoft)(`${packageManager} install`)}`
          : null,
        `${chalk.hex(theme.primarySoft)(`${packageManager} run dev`)}`,
      ]
        .filter(Boolean)
        .join("\n"),
      "Next Steps",
    );
  } catch (error) {
    p.cancel(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

main();
