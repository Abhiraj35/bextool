export const browserConfigs = {
  chrome: {
    manifestVersion: 3,
    permissions: ["storage", "activeTab"],
    background: {
      service_worker: "background.js",
      type: "module",
    },
    action: {
      default_popup: "popup.html",
      default_icon: {
        16: "icons/icon16.png",
        48: "icons/icon48.png",
        128: "icons/icon128.png",
      },
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },

  firefox: {
    manifestVersion: 2,
    permissions: ["storage", "activeTab"],
    background: {
      scripts: ["background.js"],
      persistent: false,
    },
    browser_action: {
      default_popup: "popup.html",
      default_icon: {
        16: "icons/icon16.png",
        48: "icons/icon48.png",
        128: "icons/icon128.png",
      },
    },
    browser_specific_settings: {
      gecko: {
        id: "{ADD-ON-ID}",
        strict_min_version: "57.0",
      },
    },
  },

  edge: {
    manifestVersion: 3,
    permissions: ["storage", "activeTab"],
    background: {
      service_worker: "background.js",
      type: "module",
    },
    action: {
      default_popup: "popup.html",
      default_icon: {
        16: "icons/icon16.png",
        48: "icons/icon48.png",
        128: "icons/icon128.png",
      },
    },
  },

  safari: {
    manifestVersion: 3,
    permissions: ["storage", "activeTab"],
    background: {
      service_worker: "background.js",
      type: "module",
    },
    action: {
      default_popup: "popup.html",
      default_icon: {
        16: "icons/icon16.png",
        48: "icons/icon48.png",
        128: "icons/icon128.png",
      },
    },
    safari: {
      prequel: true,
    },
  },
};
