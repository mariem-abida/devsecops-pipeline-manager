import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from models.models import PipelineModel
from services.jenkins_service import fetch_jenkins_artifact, JenkinsConfigError, JenkinsTriggerError

router = APIRouter()

@router.get("/{pipeline_id}")
def get_recommendations(pipeline_id: int, db: Session = Depends(get_db)):
    """Fetch AI Recommendations from Jenkins build artifacts."""
    
    pipeline = db.query(PipelineModel).filter(PipelineModel.id == pipeline_id).first()
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
        
    if not pipeline.build_number:
        raise HTTPException(status_code=404, detail="Pipeline has no Jenkins build number")
        
    try:
        raw_json = fetch_jenkins_artifact(pipeline.build_number, "reports/ai-security-report.json")
    except JenkinsConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except JenkinsTriggerError as exc:
        raise HTTPException(status_code=404, detail="AI report not found in artifacts")
        
    try:
        report_data = json.loads(raw_json)
        # Ensure pipeline_id is injected so frontend knows it matches
        report_data["pipeline_id"] = pipeline_id
        return report_data
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI report JSON: {exc}")
