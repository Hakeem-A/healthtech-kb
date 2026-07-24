"""
server/app/core/cors.py

Starlette's CORSMiddleware applies ONE policy to the whole app. The React
client (credentialed, JWT, small trusted origin set) and the embedded
widget (no credentials, API key, one origin per embedding host) need
different policies, so this dispatches by path prefix to two internal
CORSMiddleware instances.

NOTE: WIDGET_PATH_PREFIX is hardcoded below. If your chat router is
mounted at a different prefix than "/api/v1/chat" in main.py, update this
constant to match -- it must exactly match the prefix used in
`app.include_router(chat_endpoints.router, prefix=...)`.

NOTE: /api/v1/chat is called by BOTH the widget (X-API-Key, no
credentials) and the dashboard (JWT Authorization header, since
get_chat_caller falls back to JWT when no API key is present). The
widget_cors policy below must therefore accept both origin sets and
both header types, even though it's still a "no credentials" policy
overall (neither caller uses cookie-based credentials mode).
"""
from starlette.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.config import settings

WIDGET_PATH_PREFIX = "/api/v1/chat"


class DualOriginCORSMiddleware:
    """
    Pure ASGI middleware. Requests under WIDGET_PATH_PREFIX get the widget
    CORS policy (no credentials, X-API-Key or Authorization allowed, both
    widget and dashboard origins allowed since both call this path);
    everything else gets the dashboard policy (credentials allowed,
    Authorization header allowed, dashboard origins only). Each policy is
    a real Starlette CORSMiddleware instance, so standard preflight/Vary-
    header handling is reused, not reimplemented.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.dashboard_cors = CORSMiddleware(
            app=app,
            allow_origins=settings.dashboard_origins_list,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type"],
        )
        self.widget_cors = CORSMiddleware(
            app=app,
            # Both the widget's own origins AND the dashboard's origins
            # can legitimately call /api/v1/chat — the widget via
            # X-API-Key, the dashboard via JWT.
            allow_origins=settings.widget_origins_list + settings.dashboard_origins_list,
            allow_credentials=False,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["X-API-Key", "Authorization", "Content-Type"],
        )
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if path.startswith(WIDGET_PATH_PREFIX):
            await self.widget_cors(scope, receive, send)
        else:
            await self.dashboard_cors(scope, receive, send)


def assert_no_origin_overlap() -> None:
    """
    Call once at app startup (see main.py). A widget-host origin
    accidentally also listed in DASHBOARD_ORIGINS (or vice versa) would
    silently grant the wrong trust level -- better a boot-time crash than
    a security bug found later.

    NOTE: this check no longer implies the two origin lists never appear
    together on the same CORS policy -- widget_cors intentionally allows
    both lists on the /api/v1/chat path (see class docstring above). This
    function only guards against a *single origin string* being listed in
    both DASHBOARD_ORIGINS and WIDGET_ORIGINS, which would be a
    misconfiguration either way.
    """
    overlap = set(settings.dashboard_origins_list) & set(settings.widget_origins_list)
    if overlap:
        raise RuntimeError(
            f"DASHBOARD_ORIGINS and WIDGET_ORIGINS overlap: {overlap}. "
            "An origin should be trusted as exactly one of dashboard or widget, not both."
        )