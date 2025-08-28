# spacy_api_server.py - Serveur API spaCy pour TaggerLPL

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import spacy
import uvicorn
import logging

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="spaCy Classification API",
    description="API de classification pour TaggerLPL",
    version="1.0.0"
)

# CORS pour permettre les requêtes depuis localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chargement du modèle spaCy français
try:
    nlp = spacy.load("fr_core_news_md")
    logger.info("✅ Modèle fr_core_news_md chargé avec succès")
except OSError:
    logger.error("❌ Modèle fr_core_news_md non trouvé. Installation requise.")
    nlp = None

# Modèles de données
class ClassificationRequest(BaseModel):
    text: str
    model: Optional[str] = "fr_core_news_md"
    return_features: Optional[bool] = True
    confidence_threshold: Optional[float] = 0.5
    available_categories: Optional[List[str]] = None

class BatchClassificationRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = "fr_core_news_md"
    return_features: Optional[bool] = True
    confidence_threshold: Optional[float] = 0.5
    available_categories: Optional[List[str]] = None

class ClassificationResult(BaseModel):
    prediction: str
    confidence: float
    features: Optional[dict] = None
    tokens_count: Optional[int] = None

class BatchClassificationResult(BaseModel):
    predictions: List[ClassificationResult]
    total_processed: int

# Mappage vers les catégories TaggerLPL
CATEGORY_MAPPING = {
    'ouverture': 'OUVERTURE',
    'engagement': 'ENGAGEMENT', 
    'explication': 'EXPLICATION',
    'reflet': 'REFLET',
    'reflet_je': 'REFLET_JE',
    'reflet_vous': 'REFLET_VOUS',
    'reflet_acq': 'REFLET_ACQ'
}

def classify_text(text: str, available_categories: Optional[List[str]] = None) -> ClassificationResult:
    """
    Classification basique avec règles simples pour démonstration.
    À remplacer par votre modèle ML entraîné.
    """
    if not nlp:
        raise HTTPException(status_code=500, detail="Modèle spaCy non disponible")
    
    doc = nlp(text.lower())
    
    # Extraction des features linguistiques
    features = {
        'pos_tags': [token.pos_ for token in doc],
        'entities': [(ent.text, ent.label_) for ent in doc.ents],
        'lemmas': [token.lemma_ for token in doc],
        'dep_parse': [(token.text, token.dep_, token.head.text) for token in doc]
    }
    
    # Classification basique par règles (À AMÉLIORER avec ML)
    text_lower = text.lower()
    prediction = "INDETERMINE"
    confidence = 0.6  # Confiance par défaut
    
    # Règles de classification simplifiées
    if any(word in text_lower for word in ['bonjour', 'bonsoir', 'salut', 'bienvenue', 'merci de', 'puis-je']):
        prediction = 'OUVERTURE'
        confidence = 0.8
    elif any(word in text_lower for word in ['je vais', 'on va', 'je fais', 'nous allons', 'action']):
        prediction = 'ENGAGEMENT'
        confidence = 0.85
    elif any(word in text_lower for word in ['parce que', 'car', 'notre politique', 'technique', 'procédure']):
        prediction = 'EXPLICATION'
        confidence = 0.75
    elif any(word in text_lower for word in ['je comprends', 'je vois', 'effectivement']):
        prediction = 'REFLET_JE'
        confidence = 0.7
    elif any(word in text_lower for word in ['vous dites', 'vous mentionnez', 'selon vous']):
        prediction = 'REFLET_VOUS'
        confidence = 0.7
    elif any(word in text_lower for word in ['oui', 'exact', 'tout à fait', 'absolument']):
        prediction = 'REFLET_ACQ'
        confidence = 0.8
    elif any(word in text_lower for word in ['reformul', 'paraphras', 'comprendre']):
        prediction = 'REFLET'
        confidence = 0.65
    
    # Vérifier si la prédiction est dans les catégories autorisées
    if available_categories and prediction not in available_categories:
        prediction = available_categories[0] if available_categories else "INDETERMINE"
        confidence = 0.3
    
    return ClassificationResult(
        prediction=prediction,
        confidence=confidence,
        features=features,
        tokens_count=len(doc)
    )

# Routes API
@app.get("/health")
async def health_check():
    """Vérification de l'état du serveur"""
    return {
        "status": "healthy",
        "model_loaded": nlp is not None,
        "model_name": "fr_core_news_md",
        "version": "1.0.0"
    }

@app.post("/classify", response_model=ClassificationResult)
async def classify_single(request: ClassificationRequest):
    """Classification d'un seul texte"""
    try:
        result = classify_text(request.text, request.available_categories)
        logger.info(f"Classification: '{request.text[:50]}...' → {result.prediction} ({result.confidence})")
        return result
    except Exception as e:
        logger.error(f"Erreur classification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch", response_model=BatchClassificationResult)
async def classify_batch(request: BatchClassificationRequest):
    """Classification en lot"""
    try:
        results = []
        for text in request.texts:
            if text and text.strip():
                result = classify_text(text, request.available_categories)
                results.append(result)
        
        logger.info(f"Batch classification: {len(results)} textes traités")
        return BatchClassificationResult(
            predictions=results,
            total_processed=len(results)
        )
    except Exception as e:
        logger.error(f"Erreur batch classification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/categories")
async def get_categories():
    """Récupère les catégories supportées"""
    return {
        "categories": list(CATEGORY_MAPPING.values()),
        "total": len(CATEGORY_MAPPING)
    }

if __name__ == "__main__":
    print("🚀 Démarrage du serveur spaCy API...")
    print("📍 URL: http://localhost:8000")
    print("📖 Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
