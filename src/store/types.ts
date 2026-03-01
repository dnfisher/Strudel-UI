export interface Step {
  active: boolean;
  notes?: string[];
}

export interface Effect {
  name: string;
  param: string;
  value: number;
  min: number;
  max: number;
  step: number;
  enabled: boolean;
  patternMode?: boolean;
  pattern?: string;
}

export interface Track {
  id: string;
  sound: string;
  label: string;
  steps: Step[];
  effects: Effect[];
  muted: boolean;
  volume: number;
  color: string;
  type: 'drum' | 'synth';
  synth?: string;
  collapsed?: boolean;
  octave?: number;
}
