"""Chef chat — natural language commands that update agent configurations."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.agent import Agent, AgentSource
from app.services.nlp_parser import parse_command, render_confirmation

router = APIRouter(prefix="/chef", tags=["Chef"])


# === Curated German cities list (mirrors the frontend list, used for NL parsing) ===
GERMAN_CITIES: list[str] = [
    "Remote", "Deutschland",
    "Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main", "Stuttgart",
    "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hannover",
    "Nürnberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster",
    "Karlsruhe", "Mannheim", "Augsburg", "Wiesbaden", "Mönchengladbach", "Gelsenkirchen",
    "Braunschweig", "Chemnitz", "Aachen", "Kiel", "Halle (Saale)", "Magdeburg",
    "Freiburg im Breisgau", "Krefeld", "Lübeck", "Mainz", "Erfurt", "Oberhausen",
    "Rostock", "Kassel", "Hagen", "Potsdam", "Saarbrücken", "Hamm",
    "Mülheim an der Ruhr", "Ludwigshafen am Rhein", "Leverkusen", "Oldenburg", "Osnabrück",
    "Solingen", "Heidelberg", "Herne", "Neuss", "Darmstadt", "Paderborn", "Regensburg",
    "Ingolstadt", "Würzburg", "Fürth", "Wolfsburg", "Offenbach am Main", "Ulm",
    "Heilbronn", "Pforzheim", "Göttingen", "Bottrop", "Trier", "Recklinghausen",
    "Reutlingen", "Bremerhaven", "Koblenz", "Bergisch Gladbach", "Jena", "Remscheid",
    "Erlangen", "Moers", "Siegen", "Hildesheim", "Salzgitter", "Cottbus",
    "Kaiserslautern", "Gütersloh", "Iserlohn", "Hanau", "Witten",
    "Esslingen am Neckar", "Ludwigsburg", "Schwerin", "Düren", "Ratingen",
    "Tübingen", "Flensburg", "Lüneburg", "Konstanz", "Bayreuth", "Bamberg",
]


# === Request / response models ===

class ChefMessage(BaseModel):
    message: str


class ChefReply(BaseModel):
    reply: str
    parsed: dict
    applied_to: list[int]
    timestamp: str


# === Routes ===

@router.post("/chat", response_model=ChefReply)
async def chat(payload: ChefMessage, db: AsyncSession = Depends(get_db)):
    """Parse a natural-language command and apply the inferred config to all hunters."""
    text = (payload.message or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Leere Nachricht")

    parsed = parse_command(text, GERMAN_CITIES)

    # Apply to all hunter agents (skip chef + cv_generator)
    stmt = select(Agent).where(
        Agent.source != AgentSource.CHEF,
        Agent.source != AgentSource.CV_GENERATOR,
    )
    result = await db.execute(stmt)
    agents = list(result.scalars().all())

    applied_to: list[int] = []
    if parsed["keywords"] or parsed["location"] or parsed["job_type"]:
        for agent in agents:
            changed = False
            if parsed["keywords"]:
                agent.keywords = parsed["keywords"]
                changed = True
            if parsed["location"]:
                agent.location = parsed["location"]
                changed = True
            # Reset pagination so next run starts fresh from page 1 with the new query
            if changed:
                agent.current_page = 1
                applied_to.append(agent.id)
        await db.commit()

    return ChefReply(
        reply=render_confirmation(parsed, len(applied_to)),
        parsed=parsed,
        applied_to=applied_to,
        timestamp=datetime.utcnow().isoformat(),
    )


@router.get("/examples")
async def examples():
    """Return quick-start example commands the UI can show as chips."""
    return {
        "examples": [
            "Suche Werkstudent Power BI in Berlin",
            "Find Python jobs in München",
            "Praktikum Data Analyst in Hamburg",
            "Vollzeit SAP Berater in Frankfurt",
            "Werkstudent Wirtschaftsinformatik in Köln",
            "Remote Cloud Engineer",
        ]
    }
