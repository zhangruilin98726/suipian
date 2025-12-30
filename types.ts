
export enum Sentiment {
  HAPPY = 'HAPPY',
  CALM = 'CALM',
  ANXIOUS = 'ANXIOUS',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
  REMEMBERING = 'REMEMBERING',
  AWAKENING = 'AWAKENING'
}

export enum FragmentType {
  DUST = 'DUST',
  SHARD = 'SHARD',
  BOKEH = 'BOKEH',
  STAR = 'STAR'
}

export interface Fragment {
  id: string;
  content: string;
  sentiment: Sentiment;
  type: FragmentType;
  intensity: number; // 1-10
  tags: string[];
  createdAt: number;
  isUser: boolean;
  position: [number, number, number]; // 3D coordinates
  galaxyIndex: number;
}

export interface AIAnalysis {
  sentiment: Sentiment;
  intensity: number;
  reply: string;
  tags: string[];
}
