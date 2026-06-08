import pytest
from typing import Generator


@pytest.fixture
def api_client() -> Generator[str, None, None]:
    """Provide a configured API client base URL."""
    yield "https://api.example.com"


@pytest.fixture
def auth_headers(api_client: str) -> dict[str, str]:
    """Provide authentication headers for API requests."""
    return {
        "Authorization": "Bearer test-token-123",
        "Content-Type": "application/json",
    }


@pytest.fixture
def geo_hint(request: pytest.FixtureRequest) -> str:
    """Return geo hint based on the test's marker or parameter."""
    marker = request.node.get_closest_marker("geo")
    if marker:
        return marker.args[0] if marker.args else "us-east"
    return "us-east"
