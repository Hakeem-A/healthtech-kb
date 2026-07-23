import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-this")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

    # --- CORS: dashboard origins (React client — credentialed, JWT) ---
    # comma-separated, e.g. "http://localhost:5173,https://kb-staging.example.com"
    DASHBOARD_ORIGINS: str = os.getenv("DASHBOARD_ORIGINS", "http://localhost:5173")

    # --- CORS: widget-host origins (embedded in HMIS etc. — no credentials, API key) ---
    # comma-separated, e.g. "http://localhost:8080,https://hmis-staging.example.com"
    WIDGET_ORIGINS: str = os.getenv("WIDGET_ORIGINS", "http://localhost:8080")

    # --- Widget API keys, one per embedding host app ---
    # "host_name:key,host_name2:key2" -- lets you revoke one integration
    # without affecting others.
    WIDGET_API_KEYS: str = os.getenv(
        "WIDGET_API_KEYS", "hmis_mock:dev-widget-key-change-me"
    )

    @property
    def dashboard_origins_list(self) -> list[str]:
        return [o.strip() for o in self.DASHBOARD_ORIGINS.split(",") if o.strip()]

    @property
    def widget_origins_list(self) -> list[str]:
        return [o.strip() for o in self.WIDGET_ORIGINS.split(",") if o.strip()]

    @property
    def widget_api_keys_map(self) -> dict[str, str]:
        pairs = [p.strip() for p in self.WIDGET_API_KEYS.split(",") if p.strip()]
        return dict(p.split(":", 1) for p in pairs if ":" in p)


settings = Settings()