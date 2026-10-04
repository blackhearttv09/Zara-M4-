/**
 * M4 Five OS — Frontend UI Types
 */

import React from 'react';

export type AppId =
  | 'terminal'
  | 'orchestrator'
  | 'files'
  | 'monitor'
  | 'security'
  | 'memory'
  | 'skills'
  | 'settings';

export interface AppDefinition {
  id: AppId;
  name: string;
  iconName: string;
  category: 'core' | 'tools' | 'system';
  description: string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  actionRequired?: boolean;
  requestId?: string;
}
