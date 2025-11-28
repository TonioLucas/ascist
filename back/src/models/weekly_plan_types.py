"""Weekly plan and calendar export type definitions."""

from datetime import datetime, date
from typing import Optional, Dict, List, TypedDict, Literal
from pydantic import BaseModel


# Farol types as defined by Método Ascensão
FarolType = Literal["farol1", "farol2", "farol3", "tempo-coringa", "desvio-de-rota"]

# Day index (0=Monday, 6=Sunday)
DayIndex = Literal[0, 1, 2, 3, 4, 5, 6]


class SlotEntry(TypedDict):
    """Entry assigned to a slot."""
    sourceId: str  # objetivo tarefa index or farol entry id
    label: str
    tipo: FarolType
    objetivoId: Optional[str]  # for farol1, which objetivo it belongs to


class WeeklyPlanDoc(BaseModel):
    """WeeklyPlanDoc - Document stored at users/{uid}/weeklyPlans/{weekStartISO}."""
    weekStartISO: str  # YYYY-MM-DD, Monday
    slots: Dict[str, SlotEntry]  # slotId -> entry
    insights: str
    updatedAt: datetime


class ExportCalendarRequest(TypedDict):
    """HTTPS callable payload front→back."""
    weekStartISO: str  # YYYY-MM-DD Monday
    timezone: str  # e.g., "America/Sao_Paulo"


class ExportCalendarResponse(TypedDict):
    """Response structure for export_calendar callable."""
    success: bool
    weekStartISO: str
    exportedCount: int
    overwrittenCount: int
    calendarEventIds: Dict[str, str]  # slotId -> Google eventId
    calendarId: str
    message: Optional[str]


# Google Calendar color mapping for Farol types
# Reference: https://developers.google.com/calendar/api/v3/reference/colors
# Google Calendar colorIds: 1-11 (string)
FAROL_CALENDAR_COLORS: Dict[str, str] = {
    "farol1": "3",       # Grape (purple)
    "farol2": "5",       # Banana (yellow)
    "farol3": "10",      # Basil (green)
    "tempo-coringa": "7",  # Peacock (cyan/light blue)
    "desvio-de-rota": "9",  # Blueberry (dark blue)
}


def parse_slot_id(slot_id: str) -> Optional[Dict]:
    """Parse slot ID to extract components.

    Args:
        slot_id: Slot ID in format `YYYY-MM-DD-dayIndex-hour`

    Returns:
        Dict with weekISO, dayIndex, hour or None if invalid
    """
    parts = slot_id.split("-")
    if len(parts) < 5:
        return None

    week_iso = "-".join(parts[:3])  # YYYY-MM-DD
    day_index = int(parts[3])
    hour = int(parts[4])

    return {
        "weekISO": week_iso,
        "dayIndex": day_index,
        "hour": hour,
    }


def slot_to_event(
    slot_id: str,
    entry: SlotEntry,
    week_start_iso: str,
    timezone: str
) -> Dict:
    """Convert a slot entry to Google Calendar event dict.

    Args:
        slot_id: Slot identifier
        entry: Slot entry data
        week_start_iso: Week start date (Monday) in YYYY-MM-DD format
        timezone: User's timezone (e.g., "America/Sao_Paulo")

    Returns:
        Dict representing Google Calendar event
    """
    parsed = parse_slot_id(slot_id)
    if not parsed:
        raise ValueError(f"Invalid slot_id: {slot_id}")

    day_index = parsed["dayIndex"]
    hour = parsed["hour"]

    # Calculate event date
    week_start = date.fromisoformat(week_start_iso)
    event_date = week_start + __import__('datetime').timedelta(days=day_index)

    # Create datetime strings for start and end
    start_datetime = f"{event_date.isoformat()}T{hour:02d}:00:00"
    end_datetime = f"{event_date.isoformat()}T{hour + 1:02d}:00:00"

    # Build event summary with Farol prefix
    farol_labels = {
        "farol1": "FAROL 1",
        "farol2": "FAROL 2",
        "farol3": "FAROL 3",
        "tempo-coringa": "CORINGA",
        "desvio-de-rota": "DESVIO",
    }
    prefix = farol_labels.get(entry["tipo"], "ASCIST")
    summary = f"[{prefix}] {entry['label']}"

    # Build description
    description_parts = [f"Tipo: {entry['tipo']}"]
    if entry.get("objetivoId"):
        description_parts.append(f"Objetivo: {entry['objetivoId']}")
    description_parts.append("\n---\nCriado por ascist")
    description = "\n".join(description_parts)

    return {
        "summary": summary,
        "description": description,
        "start": {
            "dateTime": start_datetime,
            "timeZone": timezone,
        },
        "end": {
            "dateTime": end_datetime,
            "timeZone": timezone,
        },
        "colorId": FAROL_CALENDAR_COLORS.get(entry["tipo"], "1"),
        "extendedProperties": {
            "private": {
                "ascistWeek": week_start_iso,
                "ascistSlotId": slot_id,
                "ascistFarolType": entry["tipo"],
            }
        },
    }
