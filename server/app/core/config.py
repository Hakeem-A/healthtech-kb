from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        extra="ignore",
    )

    SECRET_KEY: str = "super-secret-key-change-this"
    ALGORITHM: str = "HS256"

    # --- CORS: dashboard origins (React client — credentialed, JWT) ---
    # comma-separated, e.g. "http://localhost:5173,https://kb-staging.example.com"
    DASHBOARD_ORIGINS: str = "http://localhost:5173"

    # --- CORS: widget-host origins (embedded in HMIS etc. — no credentials, API key) ---
    # comma-separated, e.g. "http://localhost:8080,https://hmis-staging.example.com"
    WIDGET_ORIGINS: str = "http://localhost:8080"

    # --- Widget API keys, one per embedding host app ---
    # "host_name:key,host_name2:key2" -- lets you revoke one integration
    # without affecting others.
    WIDGET_API_KEYS: str = ""

    # --- OpenRouter (LLM-backed chat replies) ---
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "nvidia/nemotron-3-nano-30b-a3b:free"
    OR_SITE_URL: str = "http://localhost:5173"
    OR_APP_NAME: str = "healthtech-kb"

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