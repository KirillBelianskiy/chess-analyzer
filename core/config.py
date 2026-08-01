from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    llm_api_key: str
    redis_url: str = "redis://localhost:6379"
    stockfish_path: str = "stockfish"

    class Config:
        env_file = ".env"


settings = Settings()
