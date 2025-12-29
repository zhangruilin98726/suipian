
import React from 'react';

export const COLORS = {
  // Pure Deep Space
  BG: {
    DEEP: '#000000', 
    MID: '#010105',
    NEAR: '#020208',
  },
  // Refined cosmic palette: High-end cinematic colors
  STARDUST: {
    CYAN_WHITE: '#e0f7fa',
    GOLD: '#ffd54f',
    LAVENDER: '#ce93d8',
    CORAL: '#ff8a65',
    DEEP_BLUE: '#0d1b2a',
    STEEL: '#90a4ae'
  },
  SENTIMENT: {
    HAPPY: '#FFD54F',   // Amber/Gold (Warm stars)
    CALM: '#4DD0E1',    // Cyan (Nebula gas)
    ANXIOUS: '#CE93D8', // Lavender (High energy)
    SAD: '#78909C',     // Steel Blue (Cold distance)
    ANGRY: '#FF7043',   // Coral/Orange (Hot stars)
  },
  UI: {
    PRIMARY: '#4a9eff',
    ACCENT: '#2d7fe0',
    DIM: '#1a5fb0',
    GLASS: 'rgba(0, 0, 0, 0.8)',
    BORDER: 'rgba(255, 255, 255, 0.05)',
  }
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
  )
};
