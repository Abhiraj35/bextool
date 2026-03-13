#!/usr/bin/env node

import * as p from "@clack/prompts";
import chalk from "chalk";
import { fileGenerator } from "./utils/file-generator.js";
import { execa } from "execa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.clear();

  p.intro(chalk.bgCyan(" Create Browser Extension "));

  const packageManager = "npm";

  try {
    const projectName = await p.text({
      message: "What is the name of your extension?",
      placeholder: "my-awesome-extension",
      validate(value) {
        if (!value) return "Project name is required";
        if (value.includes(" ")) return "Project name cannot contain spaces";
        return undefined;
      },
    });

    if (p.isCancel(projectName)) {
      p.cancel("Operation cancelled");
      return process.exit(0);
    }

    const description = await p.text({
      message: "Write a short description for your extension:",
      placeholder: "My awesome browser extension",
    });

    if (p.isCancel(description)) {
      p.cancel("Operation cancelled");
      return process.exit(0);
    }

    const version = await p.text({
      message: "Initial version:",
      placeholder: "1.0.0",
      initialValue: "1.0.0",
    });

    if (p.isCancel(version)) {
      p.cancel("Operation cancelled");
      return process.exit(0);
    }

    const browser = await p.select({
      message: "Which browser do you want to target ?",
      options: [
        { value: "chrome", label: "Google Chrome", hint: "Manifest V3" },
        { value: "firefox", label: "Mozilla Firefox", hint: "Manifest V2" },
        { value: "edge", label: "Microsoft Edge", hint: "Manifest V3" },
        { value: "safari", label: "Apple Safari", hint: "Limited support" },
      ],
      required: true,
      initialValue: "chrome",
    });

    if (p.isCancel(browser)) {
      p.cancel("Operation cancelled");
      return process.exit(0);
    }

    const templateType = await p.select({
      message: "Select extension type:",
      options: [
        {
          value: "popup",
          label: "Popup Extension",
          hint: "With browser action popup",
        },
        { value: "content", label: "Content Script", hint: "Modify web pages" },
        {
          value: "background",
          label: "Background Script",
          hint: "Background processes",
        },
        {
          value: "full",
          label: "Full Featured",
          hint: "All features included",
        },
      ],
    });

    if (p.isCancel(templateType)) {
      p.cancel("Operation cancelled");
      return process.exit(0);
    }

    const permissions = await p.multiselect({
      message: "Select required permissions:",
      options: [
        { value: "storage", label: "Storage", hint: "Save data locally" },
        { value: "tabs", label: "Tabs", hint: "Access browser tabs" },
        { value: "activeTab", label: "Active Tab", hint: "Access current tab" },
        {
          value: "webNavigation",
          label: "Web Navigation",
          hint: "Track navigation",
        },
        { value: "bookmarks", label: "Bookmarks", hint: "Access bookmarks" },
        { value: "history", label: "History", hint: "Access browsing history" },
      ],
    });

    if (p.isCancel(permissions)) {
      p.cancel("Operation cancelled");
      return process.exit(0);
    }

    const targetPath = path.join(process.cwd(), projectName);

    const s = p.spinner();
    s.start("Creating your extension...");

    await fileGenerator.generate({
      projectName,
      description,
      version,
      browser,
      templateType,
      permissions,
      targetPath,
    });

    s.stop("Project structure created successfully!");

    const installDeps = await p.confirm({
      message: "Do you want to install dependencies ?",
      initialValue: true,
    });

    if (installDeps && !p.isCancel(installDeps)) {
      s.start("Installing dependencies...");

      try {
        process.chdir(targetPath);

        if (packageManager === "npm") {
          await execa(packageManager, ["install"]);
        } else {
          throw new Error(
            "We encountered an error while installing dependencies !",
          );
        }

        s.stop("Dependencies installed successfully !");
      } catch (error) {
        s.stop("Failed to install dependencies");
        console.log(chalk.yellow("You can manually run npm install later"));
      }
    }

    p.outro(chalk.green("😃 Extension created successfully!"));

    console.log("\n" + chalk.bold("Next steps:"));
    console.log(chalk.cyan(`  cd ${projectName}`));

    if (!installDeps) {
      console.log(chalk.cyan(`  ${packageManager} install`));
    }

    console.log(chalk.cyan(`  ${packageManager} run dev`));
    console.log("\n" + chalk.dim("Happy coding! 🚀"));
  } catch (error) {
    p.cancel(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

main();
