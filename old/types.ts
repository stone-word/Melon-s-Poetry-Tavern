export enum Role {
  PLAYER = 'PLAYER',
  BARTENDER = 'BARTENDER',
  WAITER = 'WAITER',
  CUSTOMER = 'CUSTOMER',
  POET = 'POET'
}

export interface Position {
  c: number; // Column (Grid X)
  r: number; // Row (Grid Y)
  pixelX: number;
  pixelY: number;
}

export interface Agent extends Position {
  id: number;
  role: Role;
  color: string;
  path: Position[];
  speed: number;
  state: string;
  identity?: CustomerIdentity;
}

export interface CustomerIdentity {
  age: number;
  gender: string;
  occupation: string;
  personality: string;
  motivation: string;
  mood: string;
  isShanghainese: boolean;
}

export interface DialogueState {
  isOpen: boolean;
  speakerName: string;
  content: string;
  isThinking: boolean;
  role: Role | null;
  customerId?: number;
}

export const TILE_SIZE = 32;
export const COLS = 48;
export const ROWS = 32;