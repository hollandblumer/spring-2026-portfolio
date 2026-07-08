from datetime import datetime
from typing import Optional

import strawberry
from strawberry.fastapi import GraphQLRouter

from repository import get_analysis_run, list_analysis_runs


@strawberry.type
class Sample:
    title: Optional[str]
    sample_id: Optional[str]
    tall: bool


@strawberry.type
class AnalysisElement:
    id: str
    element_key: Optional[str]
    label: str
    x: Optional[str]
    y: Optional[str]
    confidence: Optional[str]
    reference_id: Optional[str]
    description: str
    samples: list[Sample]


@strawberry.type
class AnalysisRunType:
    id: str
    image_name: Optional[str]
    source: str
    summary: str
    created_at: datetime
    elements: list[AnalysisElement]


def sample_from_row(sample):
    return Sample(
        title=sample.get("title"),
        sample_id=sample.get("sampleId"),
        tall=bool(sample.get("tall", True)),
    )


def element_from_row(element):
    return AnalysisElement(
        id=element.id,
        element_key=element.element_key,
        label=element.label,
        x=element.x,
        y=element.y,
        confidence=element.confidence,
        reference_id=element.reference_id,
        description=element.description,
        samples=[sample_from_row(sample) for sample in element.samples or []],
    )


def analysis_from_row(run):
    return AnalysisRunType(
        id=run.id,
        image_name=run.image_name,
        source=run.source,
        summary=run.summary,
        created_at=run.created_at,
        elements=[element_from_row(element) for element in run.elements],
    )


@strawberry.type
class Query:
    @strawberry.field
    def analysis_runs(self, limit: int = 20) -> list[AnalysisRunType]:
        return [analysis_from_row(run) for run in list_analysis_runs(limit)]

    @strawberry.field
    def analysis_run(self, id: str) -> Optional[AnalysisRunType]:
        run = get_analysis_run(id)
        return analysis_from_row(run) if run else None


schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema)
