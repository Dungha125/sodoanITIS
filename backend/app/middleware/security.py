"""Security middleware — rate limit, IP blacklist, security headers."""
import logging

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import SessionLocal
from app.services.security_service import SecurityService

logger = logging.getLogger("security")

EXEMPT_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}
LOGIN_PATH_SUFFIX = "/auth/login"
LOGIN_MAX_REQUESTS = 5
LOGIN_WINDOW_SECONDS = 60.0


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    if request.client:
        return request.client.host
    return "unknown"


class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path in EXEMPT_PATHS:
            response = await call_next(request)
            return self._add_headers(response)

        ip = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")[:500]

        if ip in settings.security_whitelist_ips:
            response = await call_next(request)
            return self._add_headers(response)

        db = SessionLocal()
        try:
            svc = SecurityService(db)

            if svc.is_blacklisted(ip):
                svc.log_event(ip, "BLOCKED", path, user_agent, "IP trong blacklist")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "IP của bạn đã bị chặn do hoạt động bất thường. Liên hệ quản trị viên."},
                    headers=self._security_headers(),
                )

            if path.endswith(LOGIN_PATH_SUFFIX):
                should_block, count = svc.record_request(ip, LOGIN_WINDOW_SECONDS, LOGIN_MAX_REQUESTS)
            else:
                should_block, count = svc.record_request(
                    ip, settings.RATE_LIMIT_WINDOW_SECONDS, settings.RATE_LIMIT_MAX_REQUESTS,
                )

            if should_block:
                reason = f"Vượt {settings.RATE_LIMIT_MAX_REQUESTS} request/{settings.RATE_LIMIT_WINDOW_SECONDS}s (đếm: {count})"
                svc.blacklist_ip(ip, reason, count)
                svc.log_event(ip, "AUTO_BLACKLIST", path, user_agent, reason)
                logger.warning("Auto-blacklisted IP %s: %s", ip, reason)
                return JSONResponse(
                    status_code=403,
                    content={"detail": "IP bị chặn do gửi quá nhiều request trong thời gian ngắn."},
                    headers=self._security_headers(),
                )

            response = await call_next(request)
            return self._add_headers(response)

        except Exception:
            logger.exception("Security middleware error for IP %s", ip)
            response = await call_next(request)
            return self._add_headers(response)
        finally:
            db.close()

    def _security_headers(self) -> dict:
        headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
            "Cache-Control": "no-store",
        }
        if not settings.DEBUG:
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return headers

    def _add_headers(self, response: Response) -> Response:
        for key, value in self._security_headers().items():
            response.headers[key] = value
        return response
