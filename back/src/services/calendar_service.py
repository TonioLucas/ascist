"""Google Calendar integration service."""

from typing import Dict, List, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from src.models.weekly_plan_types import (
    SlotEntry,
    slot_to_event,
    ExportCalendarResponse,
)
from src.util.logger import get_logger

logger = get_logger(__name__)

# Google Calendar API scopes
CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def build_calendar_service(access_token: str):
    """Build Google Calendar API service from OAuth access token.

    Args:
        access_token: User's OAuth access token with calendar.events scope

    Returns:
        Google Calendar API service instance
    """
    credentials = Credentials(token=access_token)
    service = build("calendar", "v3", credentials=credentials)
    return service


def get_existing_ascist_events(
    service,
    calendar_id: str,
    week_start_iso: str
) -> List[Dict]:
    """Get existing events created by ascist for a specific week.

    Args:
        service: Google Calendar API service
        calendar_id: Calendar ID (usually 'primary')
        week_start_iso: Week start date in YYYY-MM-DD format

    Returns:
        List of existing event dicts
    """
    try:
        # Query events with private extended property
        events_result = service.events().list(
            calendarId=calendar_id,
            privateExtendedProperty=f"ascistWeek={week_start_iso}",
            singleEvents=True,
            maxResults=200,
        ).execute()

        events = events_result.get("items", [])
        logger.info(f"Found {len(events)} existing ascist events for week {week_start_iso}")
        return events

    except HttpError as error:
        logger.error(f"Error fetching existing events: {error}")
        raise


def delete_events(service, calendar_id: str, event_ids: List[str]) -> int:
    """Delete multiple events by ID.

    Args:
        service: Google Calendar API service
        calendar_id: Calendar ID
        event_ids: List of event IDs to delete

    Returns:
        Count of successfully deleted events
    """
    deleted_count = 0
    for event_id in event_ids:
        try:
            service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            deleted_count += 1
            logger.debug(f"Deleted event {event_id}")
        except HttpError as error:
            if error.resp.status == 404:
                # Event already deleted, ignore
                logger.debug(f"Event {event_id} already deleted")
            else:
                logger.error(f"Error deleting event {event_id}: {error}")

    return deleted_count


def create_event(service, calendar_id: str, event_body: Dict) -> Dict:
    """Create a new calendar event.

    Args:
        service: Google Calendar API service
        calendar_id: Calendar ID
        event_body: Event data dict

    Returns:
        Created event dict
    """
    try:
        event = service.events().insert(
            calendarId=calendar_id,
            body=event_body
        ).execute()
        logger.debug(f"Created event {event['id']}: {event['summary']}")
        return event

    except HttpError as error:
        logger.error(f"Error creating event: {error}")
        raise


def export_week_plan(
    access_token: str,
    week_start_iso: str,
    slots: Dict[str, SlotEntry],
    timezone: str,
    calendar_id: str = "primary"
) -> ExportCalendarResponse:
    """Export weekly plan slots to Google Calendar.

    This function:
    1. Builds credentials from OAuth access token
    2. Queries existing ascist events for the week
    3. Deletes existing events (overwrite behavior)
    4. Creates new events for each slot entry
    5. Returns mapping of slotId -> Google eventId

    Args:
        access_token: User's OAuth access token
        week_start_iso: Week start date (Monday) in YYYY-MM-DD format
        slots: Dict mapping slotId to SlotEntry
        timezone: User's timezone (e.g., "America/Sao_Paulo")
        calendar_id: Target calendar ID (default: "primary")

    Returns:
        ExportCalendarResponse with results
    """
    logger.info(f"Starting calendar export for week {week_start_iso}")
    logger.info(f"Timezone: {timezone}, Slots to export: {len(slots)}")

    # Build service
    service = build_calendar_service(access_token)

    # Get and delete existing events for this week
    existing_events = get_existing_ascist_events(service, calendar_id, week_start_iso)
    existing_event_ids = [e["id"] for e in existing_events]
    overwritten_count = delete_events(service, calendar_id, existing_event_ids)

    logger.info(f"Deleted {overwritten_count} existing events")

    # Create new events for each slot
    calendar_event_ids: Dict[str, str] = {}
    exported_count = 0

    for slot_id, entry in slots.items():
        try:
            # Convert slot to event
            event_body = slot_to_event(slot_id, entry, week_start_iso, timezone)

            # Create event
            created_event = create_event(service, calendar_id, event_body)
            calendar_event_ids[slot_id] = created_event["id"]
            exported_count += 1

        except Exception as e:
            logger.error(f"Failed to create event for slot {slot_id}: {e}")
            # Continue with other slots

    logger.info(f"Export complete: {exported_count} events created")

    return ExportCalendarResponse(
        success=True,
        weekStartISO=week_start_iso,
        exportedCount=exported_count,
        overwrittenCount=overwritten_count,
        calendarEventIds=calendar_event_ids,
        calendarId=calendar_id,
        message=f"Exportados {exported_count} eventos para o Google Calendar",
    )
