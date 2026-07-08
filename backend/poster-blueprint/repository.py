from database import session_scope
from models import AnalysisRun, DetectedElement


def save_analysis_run(*, image_name, analysis):
    with session_scope() as session:
        if session is None:
            return None

        run = AnalysisRun(
            image_name=image_name,
            source=analysis.get("source") or "unknown",
            summary=analysis.get("summary") or "",
            sift_matches=analysis.get("siftMatches"),
        )

        for element in analysis.get("elements", []):
            details = element.get("details") or {}
            session.add(
                DetectedElement(
                    analysis_run=run,
                    element_key=element.get("id"),
                    label=element.get("label") or "Detected Element",
                    x=element.get("x"),
                    y=element.get("y"),
                    confidence=(
                        None
                        if element.get("confidence") is None
                        else str(element.get("confidence"))
                    ),
                    reference_id=element.get("referenceId"),
                    description=details.get("description") or "",
                    samples=details.get("samples") or [],
                )
            )

        session.add(run)
        session.flush()
        return run.id


def list_analysis_runs(limit=20):
    with session_scope() as session:
        if session is None:
            return []

        runs = (
            session.query(AnalysisRun)
            .order_by(AnalysisRun.created_at.desc())
            .limit(limit)
            .all()
        )

        # Touch relationship values before the session closes.
        for run in runs:
            run.elements

        return runs


def get_analysis_run(run_id):
    with session_scope() as session:
        if session is None:
            return None

        run = session.get(AnalysisRun, run_id)
        if run:
            run.elements

        return run
