# Spécification Développement - Détection Silences Réels via Audio
## Calcul Charge Cognitive (M3)

================================================================================
## OBJECTIF
================================================================================

Développer un système qui analyse les fichiers audio pour calculer les **silences réels** entre tours de parole conseiller/client, en décomposant :

1. **Silence fin tour conseiller** : Du dernier mot prononcé jusqu'au timestamp de fin
2. **Décalage timestamps** : Entre timestamp_fin_conseiller et timestamp_début_client
3. **Silence début tour client** : Du timestamp de début jusqu'au premier mot prononcé

→ **Silence total = Composante 1 + Composante 2 + Composante 3**

================================================================================
## ARCHITECTURE
================================================================================

### Composants du Système
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DATABASE (Supabase)                                          │
│    - Nouvelles colonnes analysis_pairs                          │
│    - Table silence_analysis_log (traçabilité)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. PYTHON SCRIPT (scripts/audio_analysis/)                      │
│    - SilenceDetector : Analyse VAD                              │
│    - AudioLoader : Chargement segments                          │
│    - SupabaseClient : Lecture/écriture DB                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CLI INTERFACE                                                │
│    - Exécution batch (toutes paires ou échantillon)             │
│    - Logs progression                                           │
│    - Rapport final                                              │
└─────────────────────────────────────────────────────────────────┘
```

================================================================================
## PHASE 1 : BASE DE DONNÉES
================================================================================

### Migration 001 : Colonnes analysis_pairs
```sql
-- migrations/silence_analysis/001_add_silence_columns.sql

-- ============================================================================
-- Ajout colonnes silences décomposés
-- ============================================================================

ALTER TABLE analysis_pairs

-- Silence fin tour conseiller (ms)
ADD COLUMN silence_end_conseiller_ms INT,
ADD COLUMN silence_end_conseiller_confidence FLOAT CHECK (
  silence_end_conseiller_confidence IS NULL OR 
  (silence_end_conseiller_confidence >= 0 AND silence_end_conseiller_confidence <= 1)
),

-- Silence début tour client (ms)
ADD COLUMN silence_start_client_ms INT,
ADD COLUMN silence_start_client_confidence FLOAT CHECK (
  silence_start_client_confidence IS NULL OR 
  (silence_start_client_confidence >= 0 AND silence_start_client_confidence <= 1)
),

-- Décalage timestamps (ms) - calculé depuis timestamps existants
ADD COLUMN silence_gap_timestamps_ms INT,

-- Silence total (somme des 3)
ADD COLUMN silence_total_ms INT,

-- Catégorisation
ADD COLUMN silence_category TEXT CHECK (
  silence_category IN ('court', 'moyen', 'long', 'tres_long', 'chevauchement')
),

-- Métadonnées analyse
ADD COLUMN silence_analyzed_at TIMESTAMPTZ,
ADD COLUMN silence_analysis_version TEXT,
ADD COLUMN silence_analysis_error TEXT;

-- ============================================================================
-- Index pour requêtes fréquentes
-- ============================================================================

CREATE INDEX idx_silence_total ON analysis_pairs(silence_total_ms)
  WHERE silence_total_ms IS NOT NULL;

CREATE INDEX idx_silence_category ON analysis_pairs(silence_category)
  WHERE silence_category IS NOT NULL;

-- ============================================================================
-- Fonction de calcul automatique silence_total
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_silence_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer total si les composantes sont renseignées
  IF NEW.silence_end_conseiller_ms IS NOT NULL 
     OR NEW.silence_start_client_ms IS NOT NULL 
     OR NEW.silence_gap_timestamps_ms IS NOT NULL 
  THEN
    NEW.silence_total_ms := 
      COALESCE(NEW.silence_end_conseiller_ms, 0) +
      COALESCE(NEW.silence_gap_timestamps_ms, 0) +
      COALESCE(NEW.silence_start_client_ms, 0);
    
    -- Catégoriser
    NEW.silence_category := CASE
      WHEN NEW.silence_total_ms < 0 THEN 'chevauchement'
      WHEN NEW.silence_total_ms < 200 THEN 'court'
      WHEN NEW.silence_total_ms < 800 THEN 'moyen'
      WHEN NEW.silence_total_ms < 1500 THEN 'long'
      ELSE 'tres_long'
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_silence_total
  BEFORE INSERT OR UPDATE ON analysis_pairs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_silence_total();

-- ============================================================================
-- Calculer décalage timestamps pour paires existantes
-- ============================================================================

UPDATE analysis_pairs
SET 
  silence_gap_timestamps_ms = ROUND(
    (client_start_time - conseiller_end_time) * 1000
  )::INT,
  silence_analysis_version = 'v1.0_timestamps_only'
WHERE conseiller_end_time IS NOT NULL 
  AND client_start_time IS NOT NULL;

COMMENT ON COLUMN analysis_pairs.silence_end_conseiller_ms IS 
  'Silence après dernier mot conseiller (détecté VAD)';
COMMENT ON COLUMN analysis_pairs.silence_start_client_ms IS 
  'Silence avant premier mot client (détecté VAD)';
COMMENT ON COLUMN analysis_pairs.silence_gap_timestamps_ms IS 
  'Décalage entre timestamps fin conseiller et début client';
COMMENT ON COLUMN analysis_pairs.silence_total_ms IS 
  'Silence total = end_conseiller + gap + start_client';
```

### Migration 002 : Table de log
```sql
-- migrations/silence_analysis/002_create_analysis_log.sql

-- ============================================================================
-- Table de traçabilité des analyses
-- ============================================================================

CREATE TABLE silence_analysis_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Exécution
  analysis_run_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Configuration
  audio_root_path TEXT NOT NULL,
  vad_aggressiveness INT NOT NULL CHECK (vad_aggressiveness BETWEEN 0 AND 3),
  sample_rate INT NOT NULL DEFAULT 16000,
  analysis_version TEXT NOT NULL,
  
  -- Résultats
  total_pairs INT,
  successful_pairs INT,
  failed_pairs INT,
  
  -- Performance
  avg_processing_time_ms INT,
  total_duration_seconds INT,
  
  -- Métadonnées
  executed_by TEXT,
  execution_context JSONB,
  error_summary TEXT
);

CREATE INDEX idx_analysis_log_run ON silence_analysis_log(analysis_run_id);
CREATE INDEX idx_analysis_log_date ON silence_analysis_log(started_at DESC);

-- ============================================================================
-- Table détails erreurs par paire
-- ============================================================================

CREATE TABLE silence_analysis_errors (
  error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID REFERENCES silence_analysis_log(log_id),
  pair_id INT REFERENCES analysis_pairs(pair_id),
  
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_traceback TEXT,
  
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_errors_log ON silence_analysis_errors(log_id);
CREATE INDEX idx_analysis_errors_pair ON silence_analysis_errors(pair_id);
```

================================================================================
## PHASE 2 : SCRIPT PYTHON
================================================================================

### Structure Fichiers
```
scripts/audio_analysis/
├── __init__.py
├── silence_detector.py         # Classe principale
├── audio_loader.py              # Chargement audio
├── vad_engine.py                # Voice Activity Detection
├── supabase_client.py           # Connexion DB
├── config.py                    # Configuration
├── cli.py                       # Interface CLI
└── requirements.txt             # Dépendances
```

### requirements.txt
```txt
# Audio processing
librosa==0.10.1
soundfile==0.12.1
webrtcvad==2.0.10
numpy==1.24.3

# Database
supabase==2.3.0
python-dotenv==1.0.0

# CLI & Utils
click==8.1.7
tqdm==4.66.1
colorama==0.4.6
```

### config.py
```python
# scripts/audio_analysis/config.py

"""
Configuration pour l'analyse des silences
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration globale"""
    
    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
    
    # Audio
    AUDIO_ROOT = Path(os.getenv('AUDIO_ROOT', 'D:/SONEAR/audio_files'))
    SAMPLE_RATE = 16000  # Hz
    
    # VAD
    VAD_AGGRESSIVENESS = 3  # 0-3, 3 = le plus strict
    FRAME_DURATION_MS = 30  # webrtcvad nécessite 10, 20 ou 30ms
    
    # Analyse
    CONTEXT_BEFORE_MS = 500  # Charger 500ms avant timestamp
    CONTEXT_AFTER_MS = 500   # Charger 500ms après timestamp
    
    # Seuils
    MIN_SILENCE_MS = 50      # Ignorer silences < 50ms (artéfacts)
    MAX_SILENCE_MS = 5000    # Ignorer silences > 5s (erreur probable)
    
    # Performance
    BATCH_SIZE = 10          # Nombre de paires traitées avant commit DB
    MAX_WORKERS = 4          # Parallélisation (si implémenté)
    
    # Logs
    LOG_LEVEL = 'INFO'
    LOG_FILE = Path('logs/silence_analysis.log')
    
    # Version
    ANALYSIS_VERSION = 'v1.0_vad_webrtc'
```

### vad_engine.py
```python
# scripts/audio_analysis/vad_engine.py

"""
Voice Activity Detection Engine
"""

import webrtcvad
import numpy as np
from typing import List, Tuple, Optional
import struct

class VADEngine:
    """
    Moteur de détection d'activité vocale
    """
    
    def __init__(self, aggressiveness: int = 3):
        """
        Args:
            aggressiveness: 0-3, 3 = le plus strict
        """
        self.vad = webrtcvad.Vad(aggressiveness)
        self.sample_rate = 16000
        self.frame_duration_ms = 30
        self.frame_size = int(self.sample_rate * self.frame_duration_ms / 1000)
    
    def detect_last_speech_end(
        self,
        audio: np.ndarray
    ) -> Optional[float]:
        """
        Détecte où se termine le dernier mot
        En partant de la FIN vers le DÉBUT
        
        Args:
            audio: Tableau numpy audio (16kHz, mono)
        
        Returns:
            Position en secondes depuis le début de audio, ou None
        """
        frames = self._split_into_frames(audio)
        
        # Parcourir de la fin vers le début
        for i in range(len(frames) - 1, -1, -1):
            if self._is_speech(frames[i]):
                # Trouvé dernière frame avec parole
                # Position = (index + 1) * durée_frame
                return (i + 1) * (self.frame_duration_ms / 1000)
        
        return None
    
    def detect_first_speech_start(
        self,
        audio: np.ndarray
    ) -> Optional[float]:
        """
        Détecte où commence le premier mot
        En partant du DÉBUT vers la FIN
        
        Args:
            audio: Tableau numpy audio (16kHz, mono)
        
        Returns:
            Position en secondes depuis le début de audio, ou None
        """
        frames = self._split_into_frames(audio)
        
        # Parcourir du début vers la fin
        for i, frame in enumerate(frames):
            if self._is_speech(frame):
                # Trouvé première frame avec parole
                return i * (self.frame_duration_ms / 1000)
        
        return None
    
    def get_speech_confidence(
        self,
        audio: np.ndarray
    ) -> float:
        """
        Calcule le pourcentage de frames détectées comme parole
        
        Returns:
            Ratio entre 0 et 1
        """
        frames = self._split_into_frames(audio)
        if not frames:
            return 0.0
        
        speech_count = sum(1 for frame in frames if self._is_speech(frame))
        return speech_count / len(frames)
    
    def _split_into_frames(
        self,
        audio: np.ndarray
    ) -> List[bytes]:
        """
        Découpe audio en frames de durée fixe
        
        Returns:
            Liste de frames au format bytes
        """
        # Convertir float32 [-1, 1] en int16 [-32768, 32767]
        audio_int16 = (audio * 32767).astype(np.int16)
        
        frames = []
        for i in range(0, len(audio_int16), self.frame_size):
            frame = audio_int16[i:i + self.frame_size]
            
            # Padding si dernière frame incomplète
            if len(frame) < self.frame_size:
                frame = np.pad(
                    frame,
                    (0, self.frame_size - len(frame)),
                    mode='constant'
                )
            
            # Convertir en bytes
            frames.append(frame.tobytes())
        
        return frames
    
    def _is_speech(self, frame: bytes) -> bool:
        """
        Teste si une frame contient de la parole
        
        Args:
            frame: Frame audio au format bytes
        
        Returns:
            True si parole détectée
        """
        try:
            return self.vad.is_speech(frame, self.sample_rate)
        except Exception:
            # En cas d'erreur (frame invalide), considérer comme non-parole
            return False
```

### audio_loader.py
```python
# scripts/audio_analysis/audio_loader.py

"""
Chargement segments audio
"""

import librosa
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
import soundfile as sf

class AudioLoader:
    """
    Chargement optimisé de segments audio
    """
    
    def __init__(self, audio_root: Path, sample_rate: int = 16000):
        self.audio_root = audio_root
        self.sample_rate = sample_rate
    
    def load_segment(
        self,
        audio_file: str,
        start_time: float,
        duration: float,
        context_before_ms: int = 0,
        context_after_ms: int = 0
    ) -> Optional[np.ndarray]:
        """
        Charge un segment audio avec contexte optionnel
        
        Args:
            audio_file: Chemin relatif fichier audio
            start_time: Temps de début (secondes)
            duration: Durée segment (secondes)
            context_before_ms: Contexte avant (millisecondes)
            context_after_ms: Contexte après (millisecondes)
        
        Returns:
            Audio array ou None si erreur
        """
        full_path = self.audio_root / audio_file
        
        if not full_path.exists():
            raise FileNotFoundError(f"Audio file not found: {full_path}")
        
        # Ajouter contexte
        context_before_s = context_before_ms / 1000
        context_after_s = context_after_ms / 1000
        
        offset = max(0, start_time - context_before_s)
        total_duration = duration + context_before_s + context_after_s
        
        try:
            audio, sr = librosa.load(
                str(full_path),
                sr=self.sample_rate,
                offset=offset,
                duration=total_duration,
                mono=True
            )
            return audio
            
        except Exception as e:
            raise RuntimeError(f"Error loading audio segment: {e}")
    
    def get_audio_duration(self, audio_file: str) -> Optional[float]:
        """
        Récupère la durée totale d'un fichier audio
        
        Returns:
            Durée en secondes ou None
        """
        full_path = self.audio_root / audio_file
        
        try:
            info = sf.info(str(full_path))
            return info.duration
        except Exception:
            return None
```

### silence_detector.py (CLASSE PRINCIPALE)
```python
# scripts/audio_analysis/silence_detector.py

"""
Détecteur de silences réels via analyse audio
"""

import numpy as np
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
import logging

from .audio_loader import AudioLoader
from .vad_engine import VADEngine
from .config import Config

logger = logging.getLogger(__name__)

@dataclass
class SilenceComponents:
    """Résultat analyse silence"""
    
    # Composantes (ms)
    silence_end_conseiller_ms: int
    silence_gap_timestamps_ms: int
    silence_start_client_ms: int
    silence_total_ms: int
    
    # Confiances
    end_conseiller_confidence: float
    start_client_confidence: float
    
    # Métadonnées
    category: str
    analysis_version: str
    error: Optional[str] = None

class SilenceDetector:
    """
    Détecteur principal de silences
    """
    
    def __init__(self, config: Config = None):
        self.config = config or Config()
        self.audio_loader = AudioLoader(
            self.config.AUDIO_ROOT,
            self.config.SAMPLE_RATE
        )
        self.vad = VADEngine(self.config.VAD_AGGRESSIVENESS)
    
    def analyze_pair(
        self,
        audio_file: str,
        conseiller_end_time: float,
        client_start_time: float
    ) -> SilenceComponents:
        """
        Analyse complète d'une paire conseiller-client
        
        Args:
            audio_file: Chemin relatif audio
            conseiller_end_time: Timestamp fin conseiller (s)
            client_start_time: Timestamp début client (s)
        
        Returns:
            SilenceComponents avec toutes les métriques
        """
        try:
            # 1. SILENCE FIN CONSEILLER
            silence_end, conf_end = self._analyze_end_conseiller(
                audio_file,
                conseiller_end_time
            )
            
            # 2. DÉCALAGE TIMESTAMPS
            gap_ms = int((client_start_time - conseiller_end_time) * 1000)
            
            # 3. SILENCE DÉBUT CLIENT
            silence_start, conf_start = self._analyze_start_client(
                audio_file,
                client_start_time
            )
            
            # 4. TOTAL
            silence_total = silence_end + max(0, gap_ms) + silence_start
            
            # 5. CATÉGORISATION
            category = self._categorize_silence(silence_total)
            
            return SilenceComponents(
                silence_end_conseiller_ms=silence_end,
                silence_gap_timestamps_ms=gap_ms,
                silence_start_client_ms=silence_start,
                silence_total_ms=silence_total,
                end_conseiller_confidence=conf_end,
                start_client_confidence=conf_start,
                category=category,
                analysis_version=self.config.ANALYSIS_VERSION
            )
            
        except Exception as e:
            logger.error(f"Error analyzing pair: {e}")
            return SilenceComponents(
                silence_end_conseiller_ms=0,
                silence_gap_timestamps_ms=0,
                silence_start_client_ms=0,
                silence_total_ms=0,
                end_conseiller_confidence=0.0,
                start_client_confidence=0.0,
                category='error',
                analysis_version=self.config.ANALYSIS_VERSION,
                error=str(e)
            )
    
    def _analyze_end_conseiller(
        self,
        audio_file: str,
        end_timestamp: float
    ) -> Tuple[int, float]:
        """
        Analyse silence après dernier mot conseiller
        
        Returns:
            (silence_ms, confidence)
        """
        # Charger audio AVANT le timestamp de fin
        audio = self.audio_loader.load_segment(
            audio_file,
            start_time=end_timestamp - (self.config.CONTEXT_BEFORE_MS / 1000),
            duration=self.config.CONTEXT_BEFORE_MS / 1000
        )
        
        if audio is None or len(audio) == 0:
            return 0, 0.0
        
        # Détecter fin du dernier mot
        last_speech_pos = self.vad.detect_last_speech_end(audio)
        
        if last_speech_pos is None:
            # Aucune parole détectée
            return 0, 0.0
        
        # Calculer silence
        audio_duration = len(audio) / self.config.SAMPLE_RATE
        silence_duration = audio_duration - last_speech_pos
        silence_ms = int(silence_duration * 1000)
        
        # Valider seuils
        if silence_ms < self.config.MIN_SILENCE_MS:
            silence_ms = 0
        elif silence_ms > self.config.MAX_SILENCE_MS:
            logger.warning(f"Silence anormalement long: {silence_ms}ms")
        
        # Confiance = ratio parole détectée dans le segment
        confidence = self.vad.get_speech_confidence(audio)
        
        return silence_ms, confidence
    
    def _analyze_start_client(
        self,
        audio_file: str,
        start_timestamp: float
    ) -> Tuple[int, float]:
        """
        Analyse silence avant premier mot client
        
        Returns:
            (silence_ms, confidence)
        """
        # Charger audio APRÈS le timestamp de début
        audio = self.audio_loader.load_segment(
            audio_file,
            start_time=start_timestamp,
            duration=self.config.CONTEXT_AFTER_MS / 1000
        )
        
        if audio is None or len(audio) == 0:
            return 0, 0.0
        
        # Détecter début du premier mot
        first_speech_pos = self.vad.detect_first_speech_start(audio)
        
        if first_speech_pos is None:
            # Aucune parole détectée
            return 0, 0.0
        
        # Calculer silence
        silence_ms = int(first_speech_pos * 1000)
        
        # Valider seuils
        if silence_ms < self.config.MIN_SILENCE_MS:
            silence_ms = 0
        elif silence_ms > self.config.MAX_SILENCE_MS:
            logger.warning(f"Silence anormalement long: {silence_ms}ms")
        
        # Confiance
        confidence = self.vad.get_speech_confidence(audio)
        
        return silence_ms, confidence
    
    def _categorize_silence(self, total_ms: int) -> str:
        """Catégorisation selon durée"""
        if total_ms < 0:
            return 'chevauchement'
        elif total_ms < 200:
            return 'court'
        elif total_ms < 800:
            return 'moyen'
        elif total_ms < 1500:
            return 'long'
        else:
            return 'tres_long'
```

### supabase_client.py
```python
# scripts/audio_analysis/supabase_client.py

"""
Client Supabase pour chargement/sauvegarde données
"""

from supabase import create_client, Client
from typing import List, Dict, Optional
import uuid
from datetime import datetime
import logging

from .config import Config
from .silence_detector import SilenceComponents

logger = logging.getLogger(__name__)

class SupabaseClient:
    """
    Gestionnaire connexions Supabase
    """
    
    def __init__(self, config: Config = None):
        self.config = config or Config()
        self.client: Client = create_client(
            self.config.SUPABASE_URL,
            self.config.SUPABASE_KEY
        )
        self.current_run_id: Optional[uuid.UUID] = None
    
    def load_pairs_to_analyze(
        self,
        limit: Optional[int] = None,
        pair_ids: Optional[List[int]] = None
    ) -> List[Dict]:
        """
        Charge les paires à analyser
        
        Args:
            limit: Nombre max de paires (None = toutes)
            pair_ids: Liste IDs spécifiques (None = toutes)
        
        Returns:
            Liste de dicts avec pair_id, audio_file_path, timestamps
        """
        query = self.client.table('analysis_pairs').select(
            'pair_id, audio_file_path, '
            'conseiller_end_time, client_start_time'
        )
        
        # Filtrer paires avec timestamps valides
        query = query.not_('conseiller_end_time', 'is', 'null')
        query = query.not_('client_start_time', 'is', 'null')
        query = query.not_('audio_file_path', 'is', 'null')
        
        # Filtrer paires déjà analysées (optionnel - pour ré-exécution)
        # query = query.is_('silence_analyzed_at', 'null')
        
        if pair_ids:
            query = query.in_('pair_id', pair_ids)
        
        if limit:
            query = query.limit(limit)
        
        response = query.execute()
        return response.data or []
    
    def save_silence_results(
        self,
        pair_id: int,
        results: SilenceComponents
    ) -> bool:
        """
        Sauvegarde résultats d'analyse pour une paire
        
        Returns:
            True si succès
        """
        try:
            self.client.table('analysis_pairs').update({
                'silence_end_conseiller_ms': results.silence_end_conseiller_ms,
                'silence_end_conseiller_confidence': results.end_conseiller_confidence,
                'silence_start_client_ms': results.silence_start_client_ms,
                'silence_start_client_confidence': results.start_client_confidence,
                'silence_gap_timestamps_ms': results.silence_gap_timestamps_ms,
                'silence_total_ms': results.silence_total_ms,
                'silence_category': results.category,
                'silence_analyzed_at': datetime.now().isoformat(),
                'silence_analysis_version': results.analysis_version,
                'silence_analysis_error': results.error
            }).eq('pair_id', pair_id).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving results for pair {pair_id}: {e}")
            return False
    
    def start_analysis_run(self, config: Dict) -> uuid.UUID:
        """
        Démarre un run d'analyse et retourne son ID
        """
        run_id = uuid.uuid4()
        self.current_run_id = run_id
        
        self.client.table('silence_analysis_log').insert({
            'analysis_run_id': str(run_id),
            'audio_root_path': str(config.get('audio_root', '')),
            'vad_aggressiveness': config.get('vad_aggressiveness', 3),
            'sample_rate': config.get('sample_rate', 16000),
            'analysis_version': config.get('analysis_version', 'unknown'),
            'started_at': datetime.now().isoformat()
        }).execute()
        
        return run_id
    
    def complete_analysis_run(
        self,
        run_id: uuid.UUID,
        stats: Dict
    ):
        """
        Complète un run d'analyse avec statistiques
        """
        self.client.table('silence_analysis_log').update({
            'completed_at': datetime.now().isoformat(),
            'total_pairs': stats.get('total', 0),
            'successful_pairs': stats.get('successful', 0),
            'failed_pairs': stats.get('failed', 0),
            'avg_processing_time_ms': stats.get('avg_time_ms', 0),
            'total_duration_seconds': stats.get('duration_s', 0)
        }).eq('analysis_run_id', str(run_id)).execute()
    
    def log_error(
        self,
        run_id: uuid.UUID,
        pair_id: int,
        error_type: str,
        error_message: str,
        traceback: Optional[str] = None
    ):
        """
        Log une erreur d'analyse
        """
        # Récupérer log_id du run
        log_result = self.client.table('silence_analysis_log').select('log_id').eq(
            'analysis_run_id', str(run_id)
        ).execute()
        
        if log_result.data:
            log_id = log_result.data[0]['log_id']
            
            self.client.table('silence_analysis_errors').insert({
                'log_id': log_id,
                'pair_id': pair_id,
                'error_type': error_type,
                'error_message': error_message,
                'error_traceback': traceback
            }).execute()
```

### cli.py (INTERFACE LIGNE DE COMMANDE)
```python
# scripts/audio_analysis/cli.py

"""
Interface CLI pour analyse silences
"""

import click
import logging
from pathlib import Path
from tqdm import tqdm
import time
from typing import Optional
import sys

from .config import Config
from .silence_detector import SilenceDetector
from .supabase_client import SupabaseClient

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@click.group()
def cli():
    """Analyse des silences dans les conversations"""
    pass

@cli.command()
@click.option(
    '--limit',
    type=int,
    default=None,
    help='Nombre max de paires à analyser (défaut: toutes)'
)
@click.option(
    '--pair-ids',
    type=str,
    default=None,
    help='IDs spécifiques séparés par virgules (ex: 1,2,3)'
)
@click.option(
    '--audio-root',
    type=click.Path(exists=True),
    default=None,
    help='Chemin racine fichiers audio'
)
@click.option(
    '--batch-size',
    type=int,
    default=10,
    help='Taille batch pour commits DB'
)
@click.option(
    '--dry-run',
    is_flag=True,
    help='Test sans sauvegarder en DB'
)
def analyze(
    limit: Optional[int],
    pair_ids: Optional[str],
    audio_root: Optional[str],
    batch_size: int,
    dry_run: bool
):
    """
    Analyser les silences pour les paires spécifiées
    """
    
    # Configuration
    config = Config()
    if audio_root:
        config.AUDIO_ROOT = Path(audio_root)
    config.BATCH_SIZE = batch_size
    
    # Initialisation
    detector = SilenceDetector(config)
    db = SupabaseClient(config)
    
    # Charger paires
    logger.info("Chargement des paires à analyser...")
    pair_ids_list = None
    if pair_ids:
        pair_ids_list = [int(x.strip()) for x in pair_ids.split(',')]
    
    pairs = db.load_pairs_to_analyze(limit=limit, pair_ids=pair_ids_list)
    
    if not pairs:
        logger.error("Aucune paire à analyser")
        sys.exit(1)
    
    logger.info(f"📊 {len(pairs)} paires à analyser")
    
    if dry_run:
        logger.info("🔵 MODE DRY-RUN : Aucune sauvegarde en DB")
    
    # Démarrer run
    run_id = db.start_analysis_run({
        'audio_root': str(config.AUDIO_ROOT),
        'vad_aggressiveness': config.VAD_AGGRESSIVENESS,
        'sample_rate': config.SAMPLE_RATE,
        'analysis_version': config.ANALYSIS_VERSION
    })
    
    logger.info(f"🚀 Run ID: {run_id}")
    
    # Statistiques
    stats = {
        'total': len(pairs),
        'successful': 0,
        'failed': 0,
        'total_time_ms': 0
    }
    
    # Analyse
    start_time = time.time()
    
    with tqdm(total=len(pairs), desc="Analyse") as pbar:
        batch = []
        
        for pair in pairs:
            pair_start = time.time()
            
            try:
                # Analyser
                results = detector.analyze_pair(
                    pair['audio_file_path'],
                    pair['conseiller_end_time'],
                    pair['client_start_time']
                )
                
                pair_time_ms = int((time.time() - pair_start) * 1000)
                stats['total_time_ms'] += pair_time_ms
                
                if results.error:
                    # Erreur durant analyse
                    stats['failed'] += 1
                    db.log_error(
                        run_id,
                        pair['pair_id'],
                        'analysis_error',
                        results.error
                    )
                else:
                    # Succès
                    stats['successful'] += 1
                    
                    if not dry_run:
                        batch.append((pair['pair_id'], results))
                        
                        # Commit batch
                        if len(batch) >= config.BATCH_SIZE:
                            for pid, res in batch:
                                db.save_silence_results(pid, res)
                            batch = []
                
            except Exception as e:
                logger.error(f"❌ Erreur pair {pair['pair_id']}: {e}")
                stats['failed'] += 1
                db.log_error(
                    run_id,
                    pair['pair_id'],
                    'exception',
                    str(e),
                    traceback=None
                )
            
            pbar.update(1)
        
        # Commit dernier batch
        if batch and not dry_run:
            for pid, res in batch:
                db.save_silence_results(pid, res)
    
    # Finaliser
    duration_s = int(time.time() - start_time)
    stats['duration_s'] = duration_s
    stats['avg_time_ms'] = int(stats['total_time_ms'] / stats['total'])
    
    db.complete_analysis_run(run_id, stats)
    
    # Rapport
    click.echo("\n" + "="*60)
    click.echo("📊 RAPPORT D'ANALYSE")
    click.echo("="*60)
    click.echo(f"✅ Paires réussies : {stats['successful']}/{stats['total']}")
    click.echo(f"❌ Paires échouées : {stats['failed']}/{stats['total']}")
    click.echo(f"⏱️  Temps moyen/paire : {stats['avg_time_ms']}ms")
    click.echo(f"⏱️  Durée totale : {duration_s}s ({duration_s//60}min)")
    click.echo("="*60)
    
    if dry_run:
        click.echo("🔵 Dry-run terminé - Aucune donnée sauvegardée")

@cli.command()
@click.argument('pair_id', type=int)
@click.option(
    '--audio-root',
    type=click.Path(exists=True),
    default=None
)
def test_single(pair_id: int, audio_root: Optional[str]):
    """
    Tester analyse sur une seule paire (debug)
    """
    config = Config()
    if audio_root:
        config.AUDIO_ROOT = Path(audio_root)
    
    detector = SilenceDetector(config)
    db = SupabaseClient(config)
    
    # Charger paire
    pairs = db.load_pairs_to_analyze(pair_ids=[pair_id])
    if not pairs:
        click.echo(f"❌ Paire {pair_id} introuvable")
        sys.exit(1)
    
    pair = pairs[0]
    
    click.echo(f"\n📌 Analyse paire {pair_id}")
    click.echo(f"Audio : {pair['audio_file_path']}")
    click.echo(f"Conseiller end : {pair['conseiller_end_time']}s")
    click.echo(f"Client start : {pair['client_start_time']}s")
    click.echo("\n🔍 Analyse en cours...\n")
    
    # Analyser
    results = detector.analyze_pair(
        pair['audio_file_path'],
        pair['conseiller_end_time'],
        pair['client_start_time']
    )
    
    # Afficher résultats
    click.echo("="*60)
    click.echo("📊 RÉSULTATS")
    click.echo("="*60)
    click.echo(f"Silence fin conseiller : {results.silence_end_conseiller_ms}ms (conf: {results.end_conseiller_confidence:.2f})")
    click.echo(f"Décalage timestamps    : {results.silence_gap_timestamps_ms}ms")
    click.echo(f"Silence début client   : {results.silence_start_client_ms}ms (conf: {results.start_client_confidence:.2f})")
    click.echo("-"*60)
    click.echo(f"SILENCE TOTAL          : {results.silence_total_ms}ms")
    click.echo(f"Catégorie              : {results.category}")
    click.echo("="*60)
    
    if results.error:
        click.echo(f"\n❌ Erreur : {results.error}")

if __name__ == '__main__':
    cli()
```

================================================================================
## PHASE 3 : EXÉCUTION
================================================================================

### Installation
```powershell
# 1. Créer environnement Python
cd scripts/audio_analysis
python -m venv venv

# 2. Activer environnement
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. Installer dépendances
pip install -r requirements.txt

# 4. Configurer .env
cat > .env << EOF
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
AUDIO_ROOT=D:/SONEAR/audio_files
EOF
```

### Exécution
```powershell
# Test sur 1 paire (debug)
python -m audio_analysis.cli test-single 1

# Test sur 10 paires (dry-run)
python -m audio_analysis.cli analyze --limit 10 --dry-run

# Exécution production (901 paires)
python -m audio_analysis.cli analyze

# Exécution avec paramètres personnalisés
python -m audio_analysis.cli analyze \
  --limit 100 \
  --batch-size 20 \
  --audio-root "D:/SONEAR/audio_files"

# Ré-analyser paires spécifiques
python -m audio_analysis.cli analyze --pair-ids "1,2,3,15,42"
```

================================================================================
## VALIDATION & TESTS
================================================================================

### Test Unitaire
```python
# tests/test_silence_detector.py

import pytest
import numpy as np
from audio_analysis.silence_detector import SilenceDetector
from audio_analysis.vad_engine import VADEngine

def test_vad_detects_speech():
    """Test VAD détecte parole"""
    vad = VADEngine(aggressiveness=3)
    
    # Générer audio avec signal
    audio = np.random.randn(16000) * 0.5  # 1s de bruit
    
    # (Test basique - à compléter avec audio réel)
    result = vad.get_speech_confidence(audio)
    assert 0 <= result <= 1

def test_silence_components_calculated():
    """Test calcul composantes silence"""
    detector = SilenceDetector()
    
    # Mock audio simple
    # (À compléter avec fixture audio réelle)
    pass
```

### Test Intégration
```sql
-- Vérifier résultats après exécution

-- 1. Compter paires analysées
SELECT COUNT(*) as analyzed
FROM analysis_pairs
WHERE silence_analyzed_at IS NOT NULL;

-- 2. Distribution catégories
SELECT 
  silence_category,
  COUNT(*) as count,
  ROUND(AVG(silence_total_ms)) as avg_ms
FROM analysis_pairs
WHERE silence_category IS NOT NULL
GROUP BY silence_category
ORDER BY avg_ms;

-- 3. Statistiques confiance
SELECT 
  AVG(silence_end_conseiller_confidence) as avg_conf_end,
  AVG(silence_start_client_confidence) as avg_conf_start,
  MIN(silence_end_conseiller_confidence) as min_conf_end,
  MIN(silence_start_client_confidence) as min_conf_start
FROM analysis_pairs
WHERE silence_analyzed_at IS NOT NULL;

-- 4. Paires avec erreurs
SELECT 
  pair_id,
  silence_analysis_error
FROM analysis_pairs
WHERE silence_analysis_error IS NOT NULL;
```

================================================================================
## PERFORMANCES ESTIMÉES
================================================================================

### Temps d'Exécution
```
Par paire :
- Chargement audio : ~50ms
- Analyse VAD : ~100-150ms
- Sauvegarde DB : ~20ms
TOTAL : ~200ms par paire

901 paires × 200ms = 180 secondes = 3 minutes

Avec parallélisation (4 workers) : ~45 secondes
```

### Ressources
```
Mémoire : ~100MB (chargement segments audio)
CPU : ~30-50% (VAD léger)
Disque : Lecture audio uniquement (pas d'écriture)
```

================================================================================
## PROCHAINES ÉTAPES
================================================================================

1. **Migration DB** : Exécuter 001 + 002
2. **Installation Python** : Créer venv + installer packages
3. **Test unitaire** : Tester sur 1 paire
4. **Test batch** : 10 paires en dry-run
5. **Production** : Toutes les 901 paires
6. **Validation** : Vérifier cohérence résultats
7. **Intégration UI** : Afficher silences dans interface

================================================================================
FIN DU DOCUMENT
================================================================================
