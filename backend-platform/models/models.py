from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from datetime import datetime
from database.db import Base


class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    repository_url = Column(String, nullable=False)
    branch = Column(String, default="main")
    language = Column(String, nullable=False)
    visibility = Column(String, nullable=False)
    access_method = Column(String, nullable=False)
    credential_id = Column(String, nullable=True)
    description = Column(String, nullable=True)
    last_pipeline_status = Column(String, default="NOT_STARTED")
    created_at = Column(DateTime, default=datetime.utcnow)


class PipelineModel(Base):
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=False)

    # Jenkins build number
    build_number = Column(String, nullable=False)

    status = Column(String, default="RUNNING")
    progress = Column(Integer, default=0)
    current_stage = Column(String, default="Checkout GitLab")
    duration = Column(String, default="0m 00s")
    environment = Column(String, default="Test")

    run_tests = Column(Boolean, default=True)
    run_quality = Column(Boolean, default=True)
    run_security = Column(Boolean, default=True)
    dependency_audit = Column(Boolean, default=True)
    secret_detection = Column(Boolean, default=True)
    generate_ai_suggestions = Column(Boolean, default=True)
    deploy_if_validated = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)


class TestResultModel(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)

    pipeline_id = Column(
        Integer,
        ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    build_number = Column(String, nullable=False, index=True)

    total = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    skipped = Column(Integer, default=0)

    status = Column(String, default="UNKNOWN")

    raw_report = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class QualityResultModel(Base):
    __tablename__ = "quality_results"

    id = Column(Integer, primary_key=True, index=True)

    pipeline_id = Column(
        Integer,
        ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    build_number = Column(String, nullable=False, index=True)

    status = Column(String, default="UNKNOWN")

    issue_count = Column(Integer, default=0)

    raw_report = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class SecurityResultModel(Base):
    __tablename__ = "security_results"

    id = Column(Integer, primary_key=True, index=True)

    pipeline_id = Column(
        Integer,
        ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    build_number = Column(String, nullable=False, index=True)

    status = Column(String, default="UNKNOWN")

    vulnerability_count = Column(Integer, default=0)

    raw_report = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class DeploymentResultModel(Base):
    __tablename__ = "deployment_results"

    id = Column(Integer, primary_key=True, index=True)

    pipeline_id = Column(
        Integer,
        ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    build_number = Column(String, nullable=False, index=True)

    decision = Column(String, default="UNKNOWN")

    raw_report = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class AIResultModel(Base):
    __tablename__ = "ai_results"

    id = Column(Integer, primary_key=True, index=True)

    pipeline_id = Column(
        Integer,
        ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = Column(String, default="UNKNOWN")
    model = Column(String, default="Unknown")
    report = Column(Text, nullable=True)
    raw_report = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
