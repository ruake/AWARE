"""HTTP status and protocol tests against httpbin.org."""

import json
import socket
import ssl
from urllib.parse import urlparse

import pytest
import requests


class TestHTTPStatus:
    """Tests for HTTP status codes, response times, and protocol behavior."""

    @pytest.mark.category("http")
    @pytest.mark.priority("P0")
    def test_url_resolves(self, session: requests.Session, base_url: str) -> None:
        resp = session.get(base_url, timeout=10, allow_redirects=False)
        assert resp.status_code in (200, 301, 302, 304), (
            f"Unexpected status: {resp.status_code}"
        )

    @pytest.mark.category("performance")
    @pytest.mark.priority("P0")
    def test_response_time_under_2s(self, session: requests.Session, base_url: str) -> None:
        resp = session.get(f"{base_url}/get", timeout=10)
        assert resp.elapsed.total_seconds() < 2.0, (
            f"Response too slow: {resp.elapsed.total_seconds():.2f}s"
        )

    @pytest.mark.category("security")
    @pytest.mark.priority("P0")
    def test_no_ssl_errors(self, base_url: str) -> None:
        parsed = urlparse(base_url)
        ctx = ssl.create_default_context()
        with socket.create_connection((parsed.hostname, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=parsed.hostname) as ssock:
                assert ssock.version() is not None, "SSL handshake failed"

    @pytest.mark.category("http")
    @pytest.mark.priority("P1")
    def test_content_type_present(self, session: requests.Session, base_url: str) -> None:
        resp = session.get(f"{base_url}/get", timeout=10)
        assert "Content-Type" in resp.headers, "Missing Content-Type header"

    @pytest.mark.category("http")
    @pytest.mark.priority("P1")
    def test_http2_supported(self, base_url: str) -> None:
        parsed = urlparse(base_url)
        ctx = ssl.create_default_context()
        ctx.set_alpn_protocols(["h2", "http/1.1"])
        with socket.create_connection((parsed.hostname, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=parsed.hostname) as ssock:
                negotiated = ssock.selected_alpn_protocol()
                assert negotiated == "h2", (
                    f"Server negotiated {negotiated!r}, expected 'h2'"
                )

    @pytest.mark.category("http")
    @pytest.mark.priority("P1")
    def test_redirect_chain_valid(self, session: requests.Session, base_url: str) -> None:
        visited: set[str] = set()
        url = f"{base_url}/redirect/1"
        max_redirects = 10
        for _ in range(max_redirects):
            resp = session.get(url, timeout=10, allow_redirects=False)
            if resp.status_code not in (301, 302, 303, 307, 308):
                return
            location = resp.headers.get("Location")
            assert location, "Redirect response missing Location header"
            if location.startswith("/"):
                parsed = urlparse(url)
                location = f"{parsed.scheme}://{parsed.netloc}{location}"
            assert location not in visited, f"Redirect loop detected: {location}"
            visited.add(location)
            url = location
        pytest.fail(f"Exceeded max redirects ({max_redirects})")

    @pytest.mark.category("http")
    @pytest.mark.priority("P1")
    def test_valid_json(self, session: requests.Session, base_url: str) -> None:
        resp = session.get(f"{base_url}/json", timeout=10)
        assert "json" in resp.headers.get("Content-Type", "").lower()
        data = json.loads(resp.text)
        assert isinstance(data, dict)

    @pytest.mark.category("http")
    @pytest.mark.priority("P0")
    def test_no_server_errors(self, session: requests.Session, base_url: str) -> None:
        resp = session.get(f"{base_url}/status/200", timeout=10)
        assert resp.status_code == 200, (
            f"Server error: {resp.status_code}"
        )

    @pytest.mark.category("performance")
    @pytest.mark.priority("P1")
    def test_compression_enabled(self, session: requests.Session, base_url: str) -> None:
        resp = session.get(f"{base_url}/gzip", timeout=10)
        encoding = resp.headers.get("Content-Encoding", "")
        assert encoding.lower() in ("gzip", "br", "deflate"), (
            f"Compression not enabled: Content-Encoding={encoding!r}"
        )
