import os
import pytest
import requests
from typing import Generator

BASE_URL = os.environ.get("AWARE_TARGET_URL", "https://httpbin.org")


@pytest.fixture(scope="session")
def base_url() -> str:
    return BASE_URL


@pytest.fixture(scope="session")
def session() -> requests.Session:
    s = requests.Session()
    s.verify = True
    s.headers.update({"User-Agent": "AWARE-test/1.0"})
    return s


@pytest.fixture
def api_client() -> Generator[str, None, None]:
    yield BASE_URL
