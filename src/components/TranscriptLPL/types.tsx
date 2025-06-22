// TranscriptLPL/types.tsx - Version corrigée

import { TaggedTurn, Tag, Word } from "@/context/TaggingDataContext";

// ✅ Réutiliser les types du contexte au lieu de les redéfinir
export type LPLTag = Tag;
export type TranscriptWord = Word;
export type { TaggedTurn }; // ✅ Correction: export type pour re-export

// Constante pour la largeur du drawer
export const DRAWER_WIDTH = 350;

// Interfaces des props pour les composants
export interface TranscriptLPLProps {
  callId: string;
  audioSrc: string;
}

export interface TranscriptHeaderProps {
  filename: string;
}

export interface TranscriptAudioPlayerProps {
  audioSrc: string;
  playerRef: React.RefObject<HTMLAudioElement>;
}

export interface TranscriptControlsProps {
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  drawerOpen: boolean;
  handleToggleDrawer: () => void;
  callId: string; // ✅ Ajout du callId
}

export interface TranscriptTextProps {
  handleMouseUp: () => void;
  groupedTurns: TranscriptWord[][];
  formatTime: (time: number) => string;
  fontSize: number;
  taggedTurns: TaggedTurn[]; // ✅ Type direct du contexte
  handleTagClick: (tag: TaggedTurn) => void; // ✅ Type direct du contexte
  getWordStyle: (index: number) => React.CSSProperties;
  handleWordClick: (word: TranscriptWord) => void;
  taggingTranscription: TranscriptWord[];
}

export interface TagSidePanelProps {
  drawerOpen: boolean;
  handleToggleDrawer: () => void;
  tagMode: "create" | "edit";
  selectedTaggedTurn: TaggedTurn | null; // ✅ Type direct du contexte
  selectedText: string;
  onSelectTag: (tag: LPLTag) => void; // ✅ Type direct du contexte
  onRemoveTag: () => void;
  callId: string;
  taggedTurns: TaggedTurn[]; // ✅ Type direct du contexte
  filename: string;
}
