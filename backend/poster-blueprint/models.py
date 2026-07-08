from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def generate_id():
    return str(uuid4())


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_id)
    image_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="unknown")
    summary: Mapped[str] = mapped_column(Text, default="")
    sift_matches: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    elements: Mapped[list["DetectedElement"]] = relationship(
        back_populates="analysis_run",
        cascade="all, delete-orphan",
        order_by="DetectedElement.created_at",
    )


class DetectedElement(Base):
    __tablename__ = "detected_elements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_id)
    analysis_run_id: Mapped[str] = mapped_column(
        ForeignKey("analysis_runs.id", ondelete="CASCADE"),
        index=True,
    )
    element_key: Mapped[str | None] = mapped_column(String(120), nullable=True)
    label: Mapped[str] = mapped_column(String(180), default="Detected Element")
    x: Mapped[str | None] = mapped_column(String(24), nullable=True)
    y: Mapped[str | None] = mapped_column(String(24), nullable=True)
    confidence: Mapped[str | None] = mapped_column(String(32), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    samples: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    analysis_run: Mapped[AnalysisRun] = relationship(back_populates="elements")
