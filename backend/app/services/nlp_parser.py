"""Lightweight NL parser for Chef chat commands.

Goal: extract `keywords`, `location`, and (optionally) `job_type` from a free-text
user message in German or English. No LLM — pure regex + curated dictionaries.

Examples we want to handle:
  "Search for Werkstudent Power BI in Berlin"
  "Suche Praktikum als Data Analyst in München"
  "Find Python jobs in Frankfurt"
  "Werkstudent Wirtschaftsinformatik in Köln"
  "alle Jobs für SAP in Hamburg"
"""
import re
from typing import Optional


# === Vocabulary ===

# Map various spellings -> normalized JobType value used by the Job enum
JOB_TYPES: dict[str, str] = {
    "werkstudent":   "Werkstudent",
    "werkstudenten": "Werkstudent",
    "praktikum":     "Praktikum",
    "praktikant":    "Praktikum",
    "praktikantin":  "Praktikum",
    "intern":        "Praktikum",
    "internship":    "Praktikum",
    "vollzeit":      "Vollzeit",
    "vollzeitstelle":"Vollzeit",
    "fulltime":      "Vollzeit",
    "full-time":     "Vollzeit",
    "teilzeit":      "Teilzeit",
    "minijob":       "Minijob",
}

# Words that should never become keywords
STOPWORDS: set[str] = {
    # English — search verbs / fillers
    "search", "find", "look", "looking", "for", "the", "a", "an", "and", "or",
    "in", "at", "near", "around", "any", "all", "with", "as", "to", "from",
    "want", "need", "show", "me", "give", "list", "jobs", "job", "offer",
    "offers", "position", "positions", "role", "roles",
    # English — greetings / question words / modal verbs (so "hi how are you" parses to nothing)
    "hi", "hello", "hey", "yo", "hola", "thanks", "thank", "please",
    "what", "where", "when", "why", "how", "who", "which",
    "can", "could", "would", "should", "shall", "may", "might", "must",
    "do", "does", "did", "will", "have", "has", "had",
    "be", "is", "was", "were", "been", "being", "are",
    "i", "you", "he", "she", "it", "we", "they", "us", "them", "my", "your",
    # German — common verbs / fillers
    "suche", "suchen", "finde", "finden", "such", "alle", "alles", "ich",
    "möchte", "brauche", "wollen", "willst", "bitte", "stelle", "stellen",
    "angebot", "angebote", "stellenangebote", "als", "für", "fuer",
    "mit", "bei", "und", "oder", "ein", "eine", "einen", "einer", "der",
    "die", "das", "dem", "den", "ist", "sein", "von", "zu",
    "auf", "an", "des", "du", "wir", "ihr", "sie",
    # German — greetings / question words
    "hallo", "tag", "guten", "tschüss", "danke", "wie", "wo", "wann",
    "warum", "was", "wer", "welche", "welcher", "welches",
    # Filler
    "etc", "etc.", "usw", "usw.",
}

# Optional canonical "near you" / region keywords (we treat them as locations)
REGION_ALIASES = {
    "remote": "Remote",
    "homeoffice": "Remote",
    "home-office": "Remote",
    "deutschland": "Deutschland",
    "germany": "Deutschland",
    "bundesweit": "Deutschland",
}


def parse_command(text: str, valid_cities: list[str]) -> dict:
    """Extract structured intent from a free-text command.

    Returns a dict: { keywords: list[str], location: Optional[str], job_type: Optional[str] }.
    """
    if not text:
        return {"keywords": [], "location": None, "job_type": None}

    cities_lower = {c.lower(): c for c in valid_cities}

    raw = text.strip()
    text_lower = raw.lower()

    # ---- 1) Job type ----
    job_type: Optional[str] = None
    for token, normalized in JOB_TYPES.items():
        if re.search(rf"\b{re.escape(token)}\b", text_lower):
            job_type = normalized
            break

    # ---- 2) Location ----
    # 2a) Explicit `in <City>` / `wo <City>` / `bei <City>` patterns
    location: Optional[str] = None
    pattern_in = re.search(
        r"\b(?:in|near|bei|wo|location[:=]?)\s+"
        r"([A-Za-zÄÖÜäöüß][\w\s\-/]+?)"
        r"(?=\s+(?:für|fuer|with|als|for|and|und|als|mit|\.)|\s*$|[\.,;:!?])",
        raw, flags=re.IGNORECASE,
    )
    if pattern_in:
        candidate = pattern_in.group(1).strip(" ,;.")
        if candidate.lower() in cities_lower:
            location = cities_lower[candidate.lower()]
        elif candidate.lower() in REGION_ALIASES:
            location = REGION_ALIASES[candidate.lower()]

    # 2b) Any city name as a whole word (longest match wins so "Frankfurt am Main" beats "Frankfurt")
    if not location:
        sorted_cities = sorted(valid_cities, key=lambda s: -len(s))
        for city in sorted_cities:
            if re.search(rf"\b{re.escape(city.lower())}\b", text_lower):
                location = city
                break

    # 2c) Region aliases as fallback
    if not location:
        for alias, canon in REGION_ALIASES.items():
            if re.search(rf"\b{re.escape(alias)}\b", text_lower):
                location = canon
                break

    # ---- 3) Keywords ----
    # Strip tokens that already became location / job_type
    tokens_to_strip = set()
    if location:
        for piece in re.split(r"[\s/-]+", location.lower()):
            tokens_to_strip.add(piece)
    if job_type:
        tokens_to_strip.add(job_type.lower())
        for k, v in JOB_TYPES.items():
            if v == job_type:
                tokens_to_strip.add(k)

    # Tokenize: words + tech tokens (allow . - + #) — handles "C++", "Node.js", "Power-BI"
    words = re.findall(r"[A-Za-zÄÖÜäöüß][\w\.\+\#\-]*", raw)

    keywords: list[str] = []
    seen: set[str] = set()
    for w in words:
        wl = w.lower()
        if wl in STOPWORDS:           continue
        if wl in tokens_to_strip:     continue
        if len(w) <= 1:               continue
        if wl in seen:                continue
        seen.add(wl)
        # Preserve original casing if first letter is upper, otherwise capitalise
        keywords.append(w if w[0].isupper() else w.capitalize())

    return {"keywords": keywords, "location": location, "job_type": job_type}


def render_confirmation(parsed: dict, applied_count: int) -> str:
    """Build a German confirmation message describing what we changed."""
    parts: list[str] = []
    if parsed.get("keywords"):
        kws = ", ".join(parsed["keywords"][:6])
        if len(parsed["keywords"]) > 6:
            kws += f" (+{len(parsed['keywords']) - 6} weitere)"
        parts.append(f"📝 Keywords: **{kws}**")
    if parsed.get("location"):
        parts.append(f"📍 Standort: **{parsed['location']}**")
    if parsed.get("job_type"):
        parts.append(f"💼 Typ: **{parsed['job_type']}**")

    if not parts:
        return (
            "Hmm, ich konnte keine Suchparameter finden. "
            "Versuche z. B. *\"Suche Werkstudent Power BI in Berlin\"*."
        )

    return (
        "Verstanden! Ich habe die Suchparameter aktualisiert:\n\n"
        + "\n".join(f"• {p}" for p in parts)
        + f"\n\n✅ Auf **{applied_count} Hunter-Agenten** angewendet. Sie laufen beim nächsten Tick mit den neuen Settings."
    )
