// ==============================================================================
// VibeConnect — Main Application Orchestrator
// Professional full-stack messaging platform with real-time WebSockets & WebRTC
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { calling } from './services/webrtc';

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

  // Subscribe to reactive store updates
  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const currentUser = store.currentUser;

  // Auto-select first conversation on desktop if none selected
  useEffect(() => {
    if (currentUser && !activeConversationId && store.conversations.length > 0) {
      setActiveConversationId(store.conversations[0].id);
    }
  }, [currentUser, activeConversationId]);

  // If user is not logged in, show Welcome / Onboarding Screen
  if (!currentUser) {
    return (
      <div className="w-full h-screen bg-[#07090F] overflow-hidden">
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

  // If user is logged in but Vault is locked, render PrivateVaultLock screen!
  // No chats, call logs, or media will be rendered until unlocked with Private Key.
  if (!store.isVaultUnlocked) {
    return (
      <div className="w-full h-screen bg-[#07090F] overflow-hidden">
        <PrivateVaultLock
          onUnlocked={() => {
            setTick(t => t + 1);
            if (!activeConversationId && store.conversations.length > 0) {
              setActiveConversationId(store.conversations[0].id);
            }
          }}
        />
        <CallModal />
      </div>
    );
  }

  // Active group id for group info modal
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
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex h-full overflow-hidden relative pb-16 md:pb-0">
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
          <SettingsView />
        )}

        {/* TAB 5: PROFILE */}
        {currentTab === 'profile' && (
          <ProfileView />
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'chats') setActiveConversationId(null);
        }}
        onOpenCreateGroup={() => setShowCreateGroup(true)}
      />

      {/* Modals */}
      <NewChatByPhoneModal
        isOpen={showNewChatByPhone}
        onClose={() => setShowNewChatByPhone(false)}
        onChatCreated={(convId) => {
          setActiveConversationId(convId);
          setCurrentTab('chats');
        }}
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
    </div>
  );
}
