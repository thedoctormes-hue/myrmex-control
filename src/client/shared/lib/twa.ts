/**
 * Telegram Web App (TWA) integration.
 *
 * When running inside Telegram, window.Telegram.WebApp is available.
 * This module provides a typed, safe wrapper that gracefully degrades
 * to a no-op stub when running outside Telegram.
 */

interface TWAUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TWAInitData {
  user?: TWAUser;
  start_param?: string;
  auth_date?: number;
  hash?: string;
}

interface TWAThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TWAInstance {
  initDataUnsafe: TWAInitData;
  initData: string;
  themeParams: TWAThemeParams;
  colorScheme: 'light' | 'dark';
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  onEvent(event: string, handler: () => void): void;
  offEvent(event: string, handler: () => void): void;
  sendData(data: string): void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(handler: () => void): void;
    offClick(handler: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive: boolean): void;
    hideProgress(): void;
    setParams(params: Record<string, unknown>): void;
  };
  BackButton: {
    isVisible: boolean;
    onClick(handler: () => void): void;
    offClick(handler: () => void): void;
    show(): void;
    hide(): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  version: string;
  platform: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TWAInstance;
    };
  }
}

function getTWA(): TWAInstance | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

/** Whether the app is running inside Telegram */
export function isTWA(): boolean {
  return getTWA() !== null;
}

/** Get TWA user info, or null if not in Telegram */
export function getTWAUser(): TWAUser | null {
  return getTWA()?.initDataUnsafe?.user ?? null;
}

/** Get Telegram theme params (colors) */
export function getTWATheme(): TWAThemeParams {
  return getTWA()?.themeParams ?? {};
}

/** Get Telegram color scheme */
export function getTWAColorScheme(): 'light' | 'dark' {
  return getTWA()?.colorScheme ?? 'dark';
}

/** Get start_param from deep link */
export function getTWAStartParam(): string | undefined {
  return getTWA()?.initDataUnsafe?.start_param;
}

/** Initialize Telegram Web App (call once on mount) */
export function initTWA(): void {
  const twa = getTWA();
  if (!twa) return;

  twa.ready();
  twa.expand();
  twa.setHeaderColor('#0f172a');
  twa.setBackgroundColor('#0f172a');

  // Enable closing confirmation on mobile
  if (twa.version && parseInt(twa.version) >= 6.2) {
    twa.enableClosingConfirmation();
  }
}

/** Haptic feedback wrapper */
export function haptic(
  type: 'impact' | 'notification' | 'selection',
  style?: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning'
): void {
  const twa = getTWA();
  if (!twa) return;

  switch (type) {
    case 'impact':
      twa.HapticFeedback.impactOccurred((style as 'light' | 'medium' | 'heavy') ?? 'medium');
      break;
    case 'notification':
      twa.HapticFeedback.notificationOccurred((style as 'error' | 'success' | 'warning') ?? 'success');
      break;
    case 'selection':
      twa.HapticFeedback.selectionChanged();
      break;
  }
}

/** Show Telegram Main Button */
export function showMainButton(text: string, onClick: () => void): void {
  const twa = getTWA();
  if (!twa) return;
  twa.MainButton.setText(text);
  twa.MainButton.onClick(onClick);
  twa.MainButton.show();
}

/** Hide Telegram Main Button */
export function hideMainButton(): void {
  const twa = getTWA();
  if (!twa) return;
  twa.MainButton.hide();
}

/** Show Telegram Back Button */
export function showBackButton(onClick: () => void): void {
  const twa = getTWA();
  if (!twa) return;
  twa.BackButton.onClick(onClick);
  twa.BackButton.show();
}

/** Hide Telegram Back Button */
export function hideBackButton(): void {
  const twa = getTWA();
  if (!twa) return;
  twa.BackButton.hide();
}

/** Close the Web App (return to Telegram) */
export function closeTWA(): void {
  getTWA()?.close();
}

/** Send data back to Telegram bot */
export function sendData(data: string): void {
  getTWA()?.sendData(data);
}
