import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Option Finder',
  short_name: 'Option Finder',
  version: '1.0.0',
  description:
    'Advanced Option Chain Analysis tool for Yahoo Finance. Extract strikes, analyze volume/OI walls, and get AI-powered investment insights.',
  homepage_url: 'https://github.com/XiaoruiWang-SH/xhs-ai-tool',
  icons: {
    '16': 'public/icon_16x16.png',
    '32': 'public/icon_32x32.png',
    '48': 'public/icon_48x48.png',
    '128': 'public/icon_128x128.png',
  },
  action: {
    default_title: 'Open Option Finder',
    default_icon: {
      '16': 'public/icon_16x16.png',
      '32': 'public/icon_32x32.png',
      '48': 'public/icon_48x48.png',
      '128': 'public/icon_128x128.png',
    },
  },
  side_panel: {
    default_path: 'index.html',
  },
  permissions: ['sidePanel', 'activeTab', 'tabs'],
  host_permissions: [
    'https://finance.yahoo.com/*',
    'https://generativelanguage.googleapis.com/*',
    'https://api.openai.com/*',
    'https://api.anthropic.com/*',
    'https://dashscope.aliyuncs.com/*',
  ],
  background: {
    service_worker: 'src/service_worker.ts',
  },
  content_scripts: [
    {
      js: ['src/content/yahoo-finance.ts'],
      matches: [
        'https://finance.yahoo.com/quote/*/options*',
      ],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['src/assets/*'],
      matches: ['<all_urls>'],
    },
  ],
});
