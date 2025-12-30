
import React from 'react';
import { Sentiment } from './types';

export const COLORS = {
  BG: {
    DEEP: '#000000', 
    MID: '#010105',
    NEAR: '#020208',
  },
  STARDUST: {
    CYAN_WHITE: '#e0f7fa',
    GOLD: '#ffd54f',
    LAVENDER: '#ce93d8',
    CORAL: '#ff8a65',
    DEEP_BLUE: '#0d1b2a',
    STEEL: '#90a4ae'
  },
  SENTIMENT: {
    HAPPY: '#FFD54F',
    CALM: '#B2EBF2',
    ANXIOUS: '#CE93D8',
    SAD: '#78909C',
    ANGRY: '#FF7043',
    REMEMBERING: '#CFD8DC',
    AWAKENING: '#00E5FF', 
  },
  UI: {
    PRIMARY: '#4a9eff',
    ACCENT: '#2d7fe0',
    DIM: '#1a5fb0',
    GLASS: 'rgba(0, 0, 0, 0.8)',
    BORDER: 'rgba(255, 255, 255, 0.05)',
  }
};

export const GALAXY_CONFIG = [
  { 
    id: 0, 
    name: 'PRIME_CORE', 
    pos: [0, 0, 0], 
    cameraOffset: [0, 800, 3200], 
    coreColor: '#FFFFFF', 
    shellColor: '#E0F7FF', 
    dustColor: '#FFFFFF',
    subtitle: '万物初始之源' 
  },
  { 
    id: 1, 
    name: 'AEON_CLUSTER', 
    pos: [1200, 600, 900], 
    cameraOffset: [800, 1200, 2800],
    coreColor: '#ce93d8', 
    shellColor: '#ba68c8', 
    dustColor: '#e1bee7',
    subtitle: '永恒时间的回响' 
  },
  { 
    id: 2, 
    name: 'VOOR_NEBULA', 
    pos: [-1300, -400, 800], 
    cameraOffset: [-800, 600, 2600],
    coreColor: '#0091EA', 
    shellColor: '#00E5FF', 
    dustColor: '#80DEEA',
    subtitle: '深邃理性的觉醒' 
  },
  { 
    id: 3, 
    name: 'LYRA_REACH', 
    pos: [-800, 1100, -1100], 
    cameraOffset: [-1200, 1800, 1000],
    coreColor: '#ffd54f', 
    shellColor: '#ffb300', 
    dustColor: '#fff9c4',
    subtitle: '温暖希望的余烬' 
  },
  { 
    id: 4, 
    name: 'NOVA_VOID', 
    pos: [1000, -900, -1000], 
    cameraOffset: [1800, -400, 800],
    coreColor: '#ff8a65', 
    shellColor: '#f4511e', 
    dustColor: '#ffccbc',
    subtitle: '热烈情感的爆发' 
  }
];

// 情感引力映射表：决定碎片的归宿星系
export const SENTIMENT_GALAXY_MAP: Record<Sentiment, number> = {
  [Sentiment.CALM]: 0,        // PRIME_CORE
  [Sentiment.REMEMBERING]: 1, // AEON_CLUSTER
  [Sentiment.AWAKENING]: 2,   // VOOR_NEBULA
  [Sentiment.HAPPY]: 3,       // LYRA_REACH
  [Sentiment.ANXIOUS]: 4,     // NOVA_VOID
  [Sentiment.SAD]: 4,         // NOVA_VOID
  [Sentiment.ANGRY]: 4,       // NOVA_VOID
};

export const ICONS = {
  Home: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Plus: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Box: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Bell: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Galaxy: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8a4 4 0 110 8 4 4 0 010-8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
};
