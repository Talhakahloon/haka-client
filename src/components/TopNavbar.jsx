import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useNotification } from '../contexts/NotificationContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Undo2,
  Redo2,
  Wifi,
  WifiOff,
  RotateCw,
  CheckCheck,
  Trash2,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu
} from 'lucide-react';

export default function TopNavbar() {
  const { currentUser, users, switchUser, logout } = useAuth();
  const { theme, toggleTheme, setIsCommandPaletteOpen, toggleMobileSidebar } = useUI();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotification();
  const { undo, redo, canUndo, canRedo, isOnline, isSyncing, syncChanges } = useWorkspace();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b bg-card/85 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 sticky top-0 z-20 shrink-0 gap-2">
      {/* Left: Mobile Hamburger & Search trigger */}
      <div className="flex items-center gap-2 flex-1 max-w-md min-w-0">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/70 transition-colors shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu size={19} />
        </button>

        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="text-xs sm:text-sm flex items-center text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border/50 transition-all flex-1 justify-between group shadow-2xs truncate"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            <span className="hidden sm:inline truncate">Search or jump to...</span>
            <span className="sm:hidden text-xs">Search...</span>
          </span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-2xs shrink-0">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Sync, Notifications, Theme, User Switcher */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Undo / Redo controls (hidden on small mobile) */}
        <div className="hidden lg:flex items-center border border-border/60 rounded-xl p-0.5 bg-muted/20 shadow-2xs">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground rounded-lg transition-colors"
          >
            <Undo2 size={15} />
          </button>
          <div className="w-[1px] h-3.5 bg-border mx-0.5" />
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground rounded-lg transition-colors"
          >
            <Redo2 size={15} />
          </button>
        </div>

        {/* Network & Sync indicator */}
        <button
          onClick={syncChanges}
          disabled={isSyncing}
          title={isOnline ? "Online (Click to sync)" : "Offline mode active"}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
            isOnline
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          }`}
        >
          {isSyncing ? (
            <RotateCw size={12} className="animate-spin text-primary" />
          ) : isOnline ? (
            <Wifi size={12} />
          ) : (
            <WifiOff size={12} />
          )}
          <span className="hidden md:inline">{isSyncing ? "Syncing..." : isOnline ? "Synced" : "Offline"}</span>
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* In-App Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel (Responsive Width) */}
          {showNotifications && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden text-card-foreground animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3.5 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-primary text-primary-foreground rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={markAllAsRead}
                    className="p-1 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 rounded-md hover:bg-muted transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={13} />
                    <span className="text-[11px] font-medium hidden xs:inline">Mark read</span>
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="p-1 text-muted-foreground hover:text-destructive text-xs rounded-md hover:bg-muted transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40 text-primary" />
                    All caught up! No new notifications.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-left hover:bg-muted/40 transition-colors cursor-pointer flex gap-2.5 ${
                        !n.read ? "bg-primary/5 font-medium" : ""
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs truncate ${!n.read ? "text-primary font-bold" : "text-foreground font-semibold"}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Switcher Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(prev => !prev)}
            className="flex items-center gap-1.5 p-1 sm:p-1.5 hover:bg-muted/60 rounded-xl transition-colors border border-transparent hover:border-border/60"
          >
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="w-7 h-7 rounded-full object-cover border border-border shrink-0 shadow-2xs"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-tight truncate max-w-[85px]">{currentUser?.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-none">
                {currentUser?.role}
              </p>
            </div>
            <ChevronDown size={13} className="text-muted-foreground shrink-0 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full mt-2 w-[calc(100vw-1rem)] sm:w-64 max-w-xs bg-card border rounded-2xl shadow-2xl z-50 p-2 text-card-foreground animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b mb-1.5">
                <p className="text-xs font-bold">{currentUser?.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{currentUser?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold rounded-full">
                  Role: {currentUser?.role}
                </span>
              </div>

              <div className="px-1 py-1">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground px-2 mb-1">
                  Switch Active User
                </p>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors ${
                      currentUser?.id === u.id
                        ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                        : "hover:bg-muted text-foreground font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                      <span className="truncate">{u.name}</span>
                    </div>
                    <span className="text-[10px] opacity-75 shrink-0 ml-1 font-semibold">({u.role})</span>
                  </button>
                ))}
              </div>

              <div className="border-t mt-1.5 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
