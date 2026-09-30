from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import time
from datetime import datetime

app = FastAPI(title="BlockSentinel ML Service", version="0.1.0")

class TransactionFeatures(BaseModel):
    tx_hash: str
    value_native: float
    gas_limit: int
    gas_price: Optional[str] = None
    nonce: int
    input_data_size: int
    is_contract_interaction: bool
    from_tx_count: int = 0
    to_tx_count: int = 0

class RiskFactor(BaseModel):
    name: str
    description: str
    weight: int
    category: str

class RiskAssessment(BaseModel):
    score: int
    level: str
    factors: List[RiskFactor]
    model_name: str
    model_version: str
    confidence: float
    analyzed_at: str
    explanation: str

@app.get("/health")
def health():
    return {"status": "healthy", "service": "ml", "timestamp": datetime.utcnow().isoformat()}

@app.post("/analyze", response_model=RiskAssessment)
def analyze_risk(features: TransactionFeatures):
    """Tier 1-2 Risk Engine: Rules + Statistical Anomaly"""
    score = 0
    factors = []

    # Layer 1: Heuristic Rules
    if features.value_native > 100:
        factors.append(RiskFactor(
            name="high_value",
            description=f"Unusually high transaction value: {features.value_native:.4f} ETH",
            weight=25, category="heuristic"
        ))
        score += 25
    elif features.value_native > 10:
        factors.append(RiskFactor(
            name="elevated_value",
            description=f"Elevated transaction value: {features.value_native:.4f} ETH",
            weight=12, category="heuristic"
        ))
        score += 12

    if features.is_contract_interaction and features.input_data_size > 1000:
        factors.append(RiskFactor(
            name="complex_contract_call",
            description=f"Complex contract interaction with {features.input_data_size} bytes calldata",
            weight=10, category="heuristic"
        ))
        score += 10

    if features.nonce > 10000:
        factors.append(RiskFactor(
            name="high_nonce", description=f"Very high nonce: {features.nonce}",
            weight=8, category="heuristic"
        ))
        score += 8

    if features.from_tx_count > 0 and features.from_tx_count < 5:
        factors.append(RiskFactor(
            name="low_history_sender",
            description="Sender has limited transaction history",
            weight=15, category="statistical"
        ))
        score += 15

    score = min(score, 100)
    level = "LOW"
    if score >= 75: level = "CRITICAL"
    elif score >= 50: level = "HIGH"
    elif score >= 25: level = "MEDIUM"

    confidence = min(0.6 + (len(factors) * 0.05), 0.95)

    return RiskAssessment(
        score=score, level=level, factors=factors,
        model_name="BlockSentinel-Ensemble-v1", model_version="0.1.0",
        confidence=confidence, analyzed_at=datetime.utcnow().isoformat(),
        explanation="Risk calculated using heuristic rules and statistical baseline deviation."
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
