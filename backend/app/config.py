"""Application configuration."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Hệ thống Quản lý Sổ Đoàn Điện tử"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/so_doan"
    SECRET_KEY: str = "change-me-in-production-so-doan-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    STORAGE_PATH: str = "/app/storage"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1,backend"

    # Security — blacklist khi > N request cùng IP trong window (mặc định: 20 req / 0.1s)
    RATE_LIMIT_MAX_REQUESTS: int = 20
    RATE_LIMIT_WINDOW_SECONDS: float = 0.1
    SECURITY_WHITELIST_IPS: str = "127.0.0.1,::1"

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def security_whitelist_ips(self) -> set[str]:
        return {ip.strip() for ip in self.SECURITY_WHITELIST_IPS.split(",") if ip.strip()}

    @property
    def allowed_hosts_list(self) -> list[str]:
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]


settings = Settings()
