import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const fileGenerator = {
  async generate(config) {
    const {
      projectName,
      description,
      version,
      browser,
      templateType,
      permissions,
      targetPath,
    } = config;

    if (typeof browser !== "string" || !browser) {
      throw new Error("Browser must be a single selected browser string");
    }

    await fs.ensureDir(targetPath);
    const dirs = ["icons", "src", "src/popup", "src/background", "src/content"];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(targetPath, dir));
    }
    await this.generateManifest(
      browser,
      {
        projectName,
        description,
        version,
        permissions,
        templateType,
      },
      targetPath,
    );
    await this.generateCommonFiles(templateType, targetPath);
    await this.generatebrowserpecificFiles(browser, targetPath);
    await this.generatePackageJson(
      projectName,
      description,
      version,
      targetPath,
    );
    await this.generateReadme(projectName, description, browser, targetPath);
    await this.generatePlaceholderIcons(targetPath);
  },

  async generateManifest(browser, config, targetPath) {
    const { projectName, description, version, permissions, templateType } =
      config;
    let manifest = {
      manifest_version: browser === "firefox" ? 2 : 3,
      name: projectName,
      version: version,
      description: description,
      permissions: permissions || ["storage"],
    };
    if (browser === "firefox") {
      manifest.browser_specific_settings = {
        gecko: {
          id: `${projectName}@example.com`,
          strict_min_version: "57.0",
        },
      };
      manifest.background = {
        scripts: ["src/background/background.js"],
      };
      manifest.browser_action = {
        default_popup: "src/popup/popup.html",
        default_icon: {
          16: "icons/icon16.png",
          48: "icons/icon48.png",
          128: "icons/icon128.png",
        },
      };
    } else {
      manifest.background = {
        service_worker: "src/background/background.js",
        type: "module",
      };
      manifest.action = {
        default_popup: "src/popup/popup.html",
        default_icon: {
          16: "icons/icon16.png",
          48: "icons/icon48.png",
          128: "icons/icon128.png",
        },
      };
    }
    if (templateType === "content" || templateType === "full") {
      manifest.content_scripts = [
        {
          matches: ["<all_urls>"],
          js: ["src/content/content.js"],
          css: ["src/content/content.css"],
        },
      ];
    }
    const manifestPath = path.join(targetPath, `manifest.${browser}.json`);
    await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
  },

  async generateCommonFiles(templateType, targetPath) {
    if (templateType === "popup" || templateType === "full") {
      const popupHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Extension Popup</title>
    <link rel="stylesheet" href="popup.css">
</head>
<body>
    <div class="container">
        <h1>Extension Popup</h1>
        <button id="actionButton">Click me!</button>
        <div id="status"></div>
    </div>
    <script src="popup.js"></script>
</body>
</html>`;
      const popupCss = `body {
    width: 300px;
    padding: 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
.container {
    text-align: center;
}
button {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin: 10px 0;
}
button:hover {
    background: #0056b3;
}`;
      const popupJs = `document.getElementById('actionButton').addEventListener('click', async () => {
    const status = document.getElementById('status');
    status.textContent = 'Button clicked!';
    const response = await chrome.runtime.sendMessage({ action: 'buttonClicked' });
    console.log('Background response:', response);
});`;
      await fs.writeFile(
        path.join(targetPath, "src/popup/popup.html"),
        popupHtml,
      );
      await fs.writeFile(
        path.join(targetPath, "src/popup/popup.css"),
        popupCss,
      );
      await fs.writeFile(path.join(targetPath, "src/popup/popup.js"), popupJs);
    }
    if (templateType !== "content") {
      const backgroundJs = `console.log('Background script loaded');
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    if (request.action === 'buttonClicked') {
        sendResponse({ status: 'Message received in background' });
    }
});`;
      await fs.writeFile(
        path.join(targetPath, "src/background/background.js"),
        backgroundJs,
      );
    }
    if (templateType === "content" || templateType === "full") {
      const contentJs = `console.log('Content script loaded');
const elements = document.getElementsByTagName('h1');
for (let element of elements) {
    element.style.color = 'blue';
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    sendResponse({ status: 'Message received in content script' });
});`;
      const contentCss = `.highlight {
    background-color: yellow;
    border: 2px solid orange;
}`;
      await fs.writeFile(
        path.join(targetPath, "src/content/content.js"),
        contentJs,
      );
      await fs.writeFile(
        path.join(targetPath, "src/content/content.css"),
        contentCss,
      );
    }
  },

  async generatebrowserpecificFiles(browser, targetPath) {
    const loaderJs = `module.exports = require('./manifest.${browser}.json');`;
    await fs.writeFile(path.join(targetPath, "manifest.js"), loaderJs);
  },

  async generatePackageJson(projectName, description, version, targetPath) {
    const packageJson = {
      name: projectName,
      version: version,
      description: description,
      main: "src/background/background.js",
      scripts: {
        dev: "echo 'Watch mode not implemented yet'",
        build: "echo 'Build mode not implemented yet'",
        zip: "node scripts/zip.js",
      },
      keywords: ["browser-extension"],
      author: "",
      license: "MIT",
      devDependencies: {
        "fs-extra": "^11.2.0",
      },
    };
    await fs.writeJSON(path.join(targetPath, "package.json"), packageJson, {
      spaces: 2,
    });
  },

  async generateReadme(projectName, description, browser, targetPath) {
    const browserName = browser.charAt(0).toUpperCase() + browser.slice(1);
    const loadInstruction =
      browser === "firefox"
        ? '     - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", and select `manifest.firefox.json`'
        : browser === "safari"
          ? '     - **Safari**: Enable the Safari developer tools, then add the generated extension project through the Safari Extensions workflow'
          : '     - **Chrome/Edge**: Go to `chrome://extensions`, enable Developer mode, click "Load unpacked", and select the `${projectName}` folder';
    const readme = `# ${projectName}
${description}
## Browser Support
- ✅ ${browserName}
## Project Structure
\`\`\`
${projectName}/
├── icons/
├── src/
│   ├── popup/
│   ├── background/
│   └── content/
└── manifest.${browser}.json
\`\`\`
## Development
1. Install dependencies:
     \`\`\`bash
     npm install
     \`\`\`
2. Load the extension in your browser:
${loadInstruction}
## Building for Production
\`\`\`bash
npm run build
npm run zip
\`\`\`
## License
MIT
`;
    await fs.writeFile(path.join(targetPath, "README.md"), readme);
  },

  async generatePlaceholderIcons(targetPath) {
    const iconSizes = [16, 48, 128];
    for (const size of iconSizes) {
      const iconPath = path.join(targetPath, "icons", `icon${size}.png`);
      await fs.writeFile(iconPath, "");
    }
    const iconsReadme = `# Icons
Replace these placeholder files with your actual icons.
Required sizes:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)
Icons should be in PNG format.`;
    await fs.writeFile(
      path.join(targetPath, "icons", "README.md"),
      iconsReadme,
    );
  },
};
