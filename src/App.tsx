import { useState, useEffect } from 'react';
import { Layout, TabContent } from './components/Layout';
import { ChatInterface } from './components/ChatInterface';
import { SettingsPanel } from './components/SettingsPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { TabType } from './components/Layout';
import { MessagesProvider } from './services/MessageContext';
import { AIConfigProvider } from './services/AIConfigContext';
import { useMessagesDispatch } from './services/messageHooks';
import { WatchlistService } from './services/WatchlistService';
import type { MessageSource } from './services/messageTypes';

// 内部组件，处理消息监听逻辑
function AppContent() {
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const messageDispatch = useMessagesDispatch();

  useEffect(() => {
    let port: chrome.runtime.Port | null = null;
    let reconnectTimer: any = null;
    let isConnected = false;

    const connect = () => {
      try {
        port = chrome.runtime.connect({ name: 'sidepanel' });
        isConnected = true;
        console.log('✅ 已与 service worker 建立连接');

        port.onDisconnect.addListener(() => {
          console.warn('⚠️ 与 service worker 连接断开:', chrome.runtime.lastError?.message || '未知原因');
          isConnected = false;
          port = null;
          // Attempt reconnect
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(connect, 1000);
          }
        });

      } catch (e) {
        console.error('连接失败:', e);
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(connect, 1000);
        }
      }
    };

    connect();

    // 监听来自background script的消息
    // Note: onMessage is global, independent of the port object itself typically,
    // but message delivery relies on effective connection or active listener.
    const messageListener = (message: any, _sender: any, sendResponse: any) => {
      if (message.action === 'optionChainReceived') {
        console.log('Received Option Chain Data:', message.data);
        if (messageDispatch) {
          // Check for existing item in watchlist with same symbol AND expiration date
          const watchlist = WatchlistService.getWatchlist();
          const existing = watchlist.find((i: any) =>
            i.symbol === message.data.content.symbol &&
            i.expirationDate === message.data.content.expirationDate
          );

          const collectedData = {
            ...message.data.content,
            valuation: existing?.valuation
          };

          messageDispatch({
            type: 'clearAdd',
            data: {
              id: message.data.timestamp.toString(),
              type: 'collected',
              messageSource: 'option_chain',
              sender: 'user',
              timestamp: new Date(message.data.timestamp),
              collectedData,
              showApplyButton: !!existing, // Mark as saved if already in watchlist
            },
          });
        }
        sendResponse({ success: true });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      // Cleanup
      if (port) {
        try { port.disconnect(); } catch (e) { }
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [messageDispatch]);

  return (
    <Layout>
      <ChatInterface onSettingsClick={() => setShowSettings(true)} />
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </Layout>
  );
}

function App() {
  return (
    <MessagesProvider>
      <AIConfigProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AIConfigProvider>
    </MessagesProvider>
  );
}

export default App;
