// ==============================================================================
// VibeConnect — Main Application Orchestrator
// Professional full-stack messaging platform with real-time WebSockets & WebRTC
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { calling } from './services/webrtc';
import { notifications } from './services/notifications';

// Navigation
import Sidebar from './components/Navigation/Sidebar';
import BottomNav from './components/Navigation/BottomNav';

// Private Key Vault Gatekeeper
import PrivateVaultLock from './components/Vault/PrivateVaultLock';

// Auth
import WelcomeScreen from './components/Auth/WelcomeScreen';
import LoginModal from './components/Auth/LoginModal';
import SignupModal from './components/Auth/SignupModal';
import ForgotPasswordModal from './components/Auth/ForgotPasswordModal';

// Dashboard & Chat
import ChatList from './components/Dashboard/ChatList';
import ChatArea from './components/Chat/ChatArea';
import GroupInfoModal from './components/Chat/GroupInfoModal';
import CreateGroupModal from './components/Groups/CreateGroupModal';
import JoinGroupModal from './components/Groups/JoinGroupModal';
import NewChatByPhoneModal from './components/Contacts/NewChatByPhoneModal';

// Calls
import CallModal from './components/Calls/CallModal';
import CallHistoryView from './components/Calls/CallHistoryView';

// Contacts & Profile & Settings
import ContactsView from './components/Contacts/ContactsView';
import ProfileView from './components/Profile/ProfileView';
import SettingsView from './components/Settings/SettingsView';
import QRCodeModal from './components/Navigation/QRCodeModal';

export default function App() {
  const [, setTick] = useState(0);

  // App Routing & Tab State
  const [currentTab, setCurrentTab] = useState('chats'); // 'chats', 'groups', 'calls', 'contacts', 'settings', 'profile'
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Modals
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showNewChatByPhone, setShowNewChatByPhone] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Subscribe to reactive store updates
  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const currentUser = store.currentUser;

  // Auto-detect updates for mobile app & PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const onMsg = (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          setUpdateAvailable(true);
        }
      };
      navigator.serviceWorker.addEventListener('message', onMsg);

      const checkSWUpdate = () => {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.update().catch(() => {});
            if (reg.waiting) {
              setUpdateAvailable(true);
            }
          }
        }).catch(() => {});
      };

      checkSWUpdate();
      const interval = setInterval(checkSWUpdate, 30000);
      window.addEventListener('focus', checkSWUpdate);

      return () => {
        navigator.serviceWorker.removeEventListener('message', onMsg);
        clearInterval(interval);
        window.removeEventListener('focus', checkSWUpdate);
      };
    }
  }, []);

  // Auto-select first conversation on desktop if none selected
  useEffect(() => {
    if (currentUser && !activeConversationId && store.conversations.length > 0) {
      setActiveConversationId(store.conversations[0].id);
    }
  }, [currentUser, activeConversationId]);

  // Check notification permission
  useEffect(() => {
    if (currentUser && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowNotifBanner(true);
      }
    }
  }, [currentUser]);

  const handleEnableNotifications = async () => {
    const res = await notifications.requestPermission();
    setShowNotifBanner(false);
    if (res === 'granted') {
      notifications.showMessageNotification({
        senderName: 'VibeChat 🔔',
        text: 'Chrome notifications enabled! You will now receive alerts for incoming messages.'
      });
    }
  };

  // Handle notification clicks to open specific conversation & request notification permissions
  useEffect(() => {
    window.__openConversation = (convId) => {
      if (convId) {
        setActiveConversationId(convId);
        setCurrentTab('chats');
      }
    };
    return () => {
      delete window.__openConversation;
    };
  }, [currentUser]);

  // If user is not logged in, show Welcome / Onboarding Screen
  if (!currentUser) {
    return (
      <div className="w-full h-screen bg-[#07090F] overflow-hidden relative">
        {/* Floating Auto-Update Banner for Mobile */}
        {updateAvailable && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white p-3 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between gap-2 animate-bounce">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">New Update Ready!</p>
                <p className="text-[10px] text-purple-200">Tap to load the latest version</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-purple-700 font-extrabold text-xs shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              Update
            </button>
          </div>
        )}

        <WelcomeScreen
          onOpenLogin={() => {
            setShowSignup(false);
            setShowForgot(false);
            setShowLogin(true);
          }}
          onOpenSignup={() => {
            setShowLogin(false);
            setShowForgot(false);
            setShowSignup(true);
          }}
          onQuickLogin={(userId) => store.quickSwitchUser(userId)}
        />

        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
          onSwitchToForgot={() => {
            setShowLogin(false);
            setShowForgot(true);
          }}
        />

        <SignupModal
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />

        <ForgotPasswordModal
          isOpen={showForgot}
          onClose={() => setShowForgot(false)}
          onBackToLogin={() => {
            setShowForgot(false);
            setShowLogin(true);
          }}
        />
      </div>
    );
  }

  // User is logged in, show direct messaging and calling interface
  const activeConversation = store.conversations.find(c => c.id === activeConversationId);
  const activeGroupId = activeConversation?.groupId || null;

  return (
    <div className="w-full h-screen flex bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden font-sans">
      {/* Desktop Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setTab={(tab) => {
          setCurrentTab(tab);
        }}
        onOpenCreateGroup={() => setShowCreateGroup(true)}
        onOpenProfile={() => setCurrentTab('profile')}
        onOpenQR={() => setShowQRModal(true)}
      />

      {/* Main Workspace Area */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${activeConversationId ? 'pb-0' : 'pb-16 md:pb-0'}`}>
        {/* Floating Auto-Update Banner for Mobile & Web */}
        {updateAvailable && (
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white px-4 py-2.5 flex items-center justify-between text-xs z-40 shadow-xl border-b border-white/20 animate-fade-in flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">🚀</span>
              <div>
                <strong className="font-bold">New Update Available!</strong>
                <span className="hidden sm:inline text-purple-200 ml-1.5">Latest features and fixes are ready.</span>
              </div>
            </div>
            <button
              onClick={() => window.location.reload(true)}
              className="px-3.5 py-1 rounded-lg bg-white text-purple-700 font-extrabold text-xs shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              Update Now
            </button>
          </div>
        )}

        {/* Chrome / Web Notifications Permission Activation Banner */}
        {showNotifBanner && (
          <div className="bg-gradient-to-r from-purple-900/95 via-indigo-900/95 to-purple-900/95 border-b border-purple-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-white z-30 shadow-lg flex-shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <span>
                <strong className="text-purple-300">Enable Chrome Notifications:</strong> Get real-time desktop & mobile alerts when friends message or call you.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnableNotifications}
                className="px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Allow
              </button>
              <button
                onClick={() => setShowNotifBanner(false)}
                className="p-1 text-white/60 hover:text-white rounded-md cursor-pointer text-xs"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: CHATS & GROUPS */}
        {(currentTab === 'chats' || currentTab === 'groups') && (
          <div className="flex-1 flex w-full h-full overflow-hidden">
            {/* Conversation List (hidden on mobile if chat is active) */}
            <div className={`w-full md:w-auto h-full ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
              <ChatList
                activeConversationId={activeConversationId}
                onSelectConversation={(id) => setActiveConversationId(id)}
                onOpenCreateGroup={() => setShowCreateGroup(true)}
                onOpenJoinGroup={() => setShowJoinGroup(true)}
                onOpenNewChatByPhone={() => setShowNewChatByPhone(true)}
                onOpenQR={() => setShowQRModal(true)}
                onStartCall={(callPayload) => calling.startCall(callPayload)}
              />
            </div>

            {/* Conversation Message Area (hidden on mobile if no active chat) */}
            <div className={`flex-1 h-full ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
              <ChatArea
                conversationId={activeConversationId}
                onBack={() => setActiveConversationId(null)}
                onStartCall={(callPayload) => calling.startCall(callPayload)}
                onOpenInfo={() => {
                  if (activeGroupId) setShowGroupInfo(true);
                  else setCurrentTab('contacts');
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: CALL HISTORY */}
        {currentTab === 'calls' && (
          <CallHistoryView
            onStartCall={(callPayload) => calling.startCall(callPayload)}
          />
        )}

        {/* TAB 3: CONTACTS & NICKNAMES */}
        {currentTab === 'contacts' && (
          <ContactsView
            onOpenChat={(convId) => {
              setActiveConversationId(convId);
              setCurrentTab('chats');
            }}
            onStartCall={(callPayload) => calling.startCall(callPayload)}
          />
        )}

        {/* TAB 4: SETTINGS */}
        {currentTab === 'settings' && (
          <SettingsView onOpenQR={() => setShowQRModal(true)} />
        )}

        {/* TAB 5: PROFILE */}
        {currentTab === 'profile' && (
          <ProfileView />
        )}
      </div>

      {/* Mobile Bottom Navigation - Hidden when actively chatting */}
      {!activeConversationId && (
        <BottomNav
          currentTab={currentTab}
          setTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'chats') setActiveConversationId(null);
          }}
          onOpenCreateGroup={() => setShowCreateGroup(true)}
          onOpenNewChatByPhone={() => setShowNewChatByPhone(true)}
          onOpenQR={() => setShowQRModal(true)}
        />
      )}

      {/* Modals */}
      <NewChatByPhoneModal
        isOpen={showNewChatByPhone}
        onClose={() => setShowNewChatByPhone(false)}
        onChatCreated={(convId) => {
          setActiveConversationId(convId);
          setCurrentTab('chats');
        }}
        onStartCall={(callPayload) => calling.startCall(callPayload)}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(group) => {
          const conv = store.conversations.find(c => c.groupId === group.id);
          if (conv) setActiveConversationId(conv.id);
          setCurrentTab('chats');
        }}
      />

      <JoinGroupModal
        isOpen={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        onGroupJoined={(group) => {
          const conv = store.conversations.find(c => c.groupId === group.id);
          if (conv) setActiveConversationId(conv.id);
          setCurrentTab('chats');
        }}
      />

      <GroupInfoModal
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        groupId={activeGroupId}
      />

      {/* Real Voice & Video Calling Full-Screen Overlay */}
      <CallModal />

      {/* Universal QR Code & Scanner Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onUserScanned={async (scanned) => {
          setShowQRModal(false);
          if (!scanned) return;
          const phone = scanned.phone ? scanned.phone.replace(/[^0-9]/g, '') : '';
          let target = null;
          if (phone) {
            target = store.findUserByPhone(phone) || (await store.searchUserByPhoneOnline(phone));
          }
          if (!target && scanned.id) {
            target = store.getUserById(scanned.id);
          }
          if (target) {
            const conv = await store.getDirectConversation(target.id);
            if (conv) {
              setActiveConversationId(conv.id);
              setCurrentTab('chats');
            }
          }
        }}
      />
    </div>
  );
}
