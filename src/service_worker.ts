import type { MessageSource } from './services/messageTypes';

// background.ts
/// <reference types="chrome"/>

interface Message {
  action: string;
  data?: any;
}

// 记录 side panel 的运行状态
const sidePanelStatus = {
  isRunning: false,
  tabId: null as number | null,
  port: null as chrome.runtime.Port | null,
};

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener((): void => {
  console.log('Option Finder Extension Installed');

  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true,
  });
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener(
  async (
    tabId: number,
    changeInfo: chrome.tabs.OnUpdatedInfo,
    tab: chrome.tabs.Tab
  ): Promise<void> => {
    if (
      changeInfo.status === 'complete' &&
      tab.url &&
      tab.url.includes('finance.yahoo.com')
    ) {
      chrome.action.setTitle({
        tabId: tabId,
        title: 'Open Option Finder',
      });
    }
  }
);

// 监听连接事件 - 用于追踪 side panel 状态
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    sidePanelStatus.isRunning = true;
    sidePanelStatus.tabId = port.sender?.tab?.id || null;
    sidePanelStatus.port = port;

    port.onDisconnect.addListener(() => {
      sidePanelStatus.isRunning = false;
      sidePanelStatus.tabId = null;
      sidePanelStatus.port = null;
    });
  }
});

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean => {
    switch (message.action) {
      case 'optionChainReceived':
        console.log('Option Chain Data received:', message.data);
        handleContentCollected(message.data, sender, 'option_chain', sendResponse);
        return true;

      default:
        console.log('Unknown message action:', message.action);
        sendResponse({ error: 'Unknown action' });
        return false;
    }
  }
);

// 处理内容收集事件
function handleContentCollected(
  data: any,
  sender: chrome.runtime.MessageSender,
  _type: MessageSource,
  sendResponse: (response: any) => void
): void {
  try {
    if (!sender.tab?.id) {
      sendResponse({ success: false, error: 'Invalid Tab ID' });
      return;
    }

    const currentTabId = sender.tab.id;
    let action = 'optionChainReceived';

    // 定义发送消息的函数
    const sendMessageToSidePanel = () => {
      chrome.runtime
        .sendMessage({
          action: action,
          data: data,
        })
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('Forwarding failed:', error);
          sendResponse({ success: false, error: error.message });
        });
    };

    if (sidePanelStatus.isRunning) {
      sendMessageToSidePanel();
    } else {
      openSidePanel(currentTabId, () => {
        setTimeout(() => {
          sendMessageToSidePanel();
        }, 500);
      });
    }
  } catch (error) {
    console.error('Error handling collection:', error);
    sendResponse({
      success: false,
      error: (error as Error).message,
    });
  }
}

// 打开侧边栏
function openSidePanel(tabId: number, callback?: () => void): void {
  chrome.sidePanel.open(
    {
      tabId: tabId,
    },
    () => {
      console.log('Side panel opened');
      if (callback) {
        callback();
      }
    }
  );
}
