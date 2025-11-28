"""Export calendar callable function."""

from firebase_functions import https_fn, options
from firebase_admin import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

from src.apis.Db import Db
from src.services.calendar_service import export_week_plan
from src.models.weekly_plan_types import ExportCalendarResponse
from src.util.db_auth_wrapper import db_auth_wrapper
from src.util.cors_response import cors_response_on_call
from src.util.logger import get_logger

logger = get_logger(__name__)


@https_fn.on_call(
    cors=options.CorsOptions(cors_origins=["*"]),
    ingress=options.IngressSetting.ALLOW_ALL,
)
def export_calendar_callable(req: https_fn.CallableRequest) -> ExportCalendarResponse:
    """Export weekly plan to Google Calendar.

    This function:
    1. Authenticates the user
    2. Fetches weekly plan from Firestore
    3. Exports slots to Google Calendar (overwriting existing ascist events)
    4. Updates Firestore with calendarEventIds

    Args:
        req: Firebase callable request containing ExportCalendarRequest data
            - weekStartISO: string (YYYY-MM-DD, Monday)
            - timezone: string (e.g., "America/Sao_Paulo")

    Returns:
        ExportCalendarResponse with export results
    """
    # Handle CORS preflight
    options_response = cors_response_on_call(req.raw_request)
    if options_response:
        return options_response

    try:
        # Authenticate user
        uid = db_auth_wrapper(req)
        logger.info(f"Export calendar request from user {uid}")

        # Validate request data
        week_start_iso = req.data.get("weekStartISO")
        timezone = req.data.get("timezone", "America/Sao_Paulo")

        if not week_start_iso:
            raise https_fn.HttpsError(
                https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                "weekStartISO is required"
            )

        # Get OAuth access token from the request
        # The frontend passes this via the auth context
        access_token = None
        if req.auth and hasattr(req.auth, 'token'):
            # Try to get the OAuth access token
            # This requires the calendar.events scope to be requested at sign-in
            token_data = req.auth.token
            access_token = token_data.get("access_token") if isinstance(token_data, dict) else None

        # For development/emulator, use a mock token or skip
        db = Db.get_instance()
        if db.is_development():
            logger.warning("Running in development mode - calendar export will be simulated")
            return ExportCalendarResponse(
                success=True,
                weekStartISO=week_start_iso,
                exportedCount=0,
                overwrittenCount=0,
                calendarEventIds={},
                calendarId="primary",
                message="[DEV] Export simulado - conecte-se ao Google Calendar em produção",
            )

        if not access_token:
            raise https_fn.HttpsError(
                https_fn.FunctionsErrorCode.UNAUTHENTICATED,
                "Google Calendar access token not available. Please re-authenticate with calendar permissions."
            )

        # Fetch weekly plan from Firestore
        weekly_plan_ref = (
            db.client.collection("users")
            .document(uid)
            .collection("weeklyPlans")
            .document(week_start_iso)
        )
        weekly_plan_doc = weekly_plan_ref.get()

        if not weekly_plan_doc.exists:
            raise https_fn.HttpsError(
                https_fn.FunctionsErrorCode.NOT_FOUND,
                f"No weekly plan found for week {week_start_iso}"
            )

        weekly_plan_data = weekly_plan_doc.to_dict()
        slots = weekly_plan_data.get("slots", {})

        if not slots:
            logger.info(f"No slots to export for week {week_start_iso}")
            return ExportCalendarResponse(
                success=True,
                weekStartISO=week_start_iso,
                exportedCount=0,
                overwrittenCount=0,
                calendarEventIds={},
                calendarId="primary",
                message="Nenhum slot para exportar",
            )

        # Export to Google Calendar
        result = export_week_plan(
            access_token=access_token,
            week_start_iso=week_start_iso,
            slots=slots,
            timezone=timezone,
        )

        # Update Firestore with calendar event IDs
        weekly_plan_ref.update({
            "calendarEventIds": result["calendarEventIds"],
            "lastExportedAt": SERVER_TIMESTAMP,
        })

        logger.info(f"Calendar export completed: {result['exportedCount']} events created")

        return result

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Failed to export calendar: {e}")
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.INTERNAL,
            "Falha ao exportar para o Google Calendar. Tente novamente."
        )
