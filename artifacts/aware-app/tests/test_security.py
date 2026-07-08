"""Security header, TLS, and CORS tests against httpbin.org."""

import re
import socket
import ssl
from typing import Generator

import pytest
import requests


@pytest.fixture
def sec_session() -> Generator[requests.Session, None, None]:
    sess = requests.Session()
    sess.headers.update({
        "User-Agent": "AWARE-Security-Test/1.0",
        "Accept": "text/html,application/json,*/*",
    })
    sess.max_redirects = 5
    yield sess
    sess.close()


class TestSecurityHeaders:
    """Verify security-related HTTP behavior via httpbin.org."""

    @pytest.mark.category("security")
    @pytest.mark.priority("P0")
    def test_tls_version(self, base_url: str) -> None:
        parsed = requests.utils.urlparse(base_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 443
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        with socket.create_connection((host, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=host) as tls:
                version = tls.version()
                assert version in ("TLSv1.2", "TLSv1.3"), (
                    f"TLS version {version} is below TLS 1.2"
                )

    @pytest.mark.category("security")
    @pytest.mark.priority("P0")
    def test_no_server_errors(self, sec_session: requests.Session, base_url: str) -> None:
        resp = sec_session.get(f"{base_url}/status/200", timeout=10)
        assert resp.status_code == 200

    @pytest.mark.category("security")
    @pytest.mark.priority("P1")
    def test_cors_headers(self, sec_session: requests.Session, base_url: str) -> None:
        resp = sec_session.options(f"{base_url}/anything", timeout=10)
        origin = resp.headers.get("Access-Control-Allow-Origin", "")
        assert origin, "Missing Access-Control-Allow-Origin"
        assert origin == "*" or origin.startswith("https://"), (
            f"Access-Control-Allow-Origin is too permissive: {origin}"
        )
        assert resp.headers.get("Access-Control-Allow-Methods", ""), (
            "Missing Access-Control-Allow-Methods"
        )
        assert resp.headers.get("Access-Control-Allow-Headers", ""), (
            "Missing Access-Control-Allow-Headers"
        )

    @pytest.mark.category("security")
    @pytest.mark.priority("P1")
    def test_no_clickjacking(self, sec_session: requests.Session, base_url: str) -> None:
        resp = sec_session.get(f"{base_url}/response-headers?X-Frame-Options=DENY", timeout=10)
        val = resp.headers.get("X-Frame-Options", "")
        if val:
            assert val.upper() in ("DENY", "SAMEORIGIN"), (
                f"X-Frame-Options allows framing: {val}"
            )

    @pytest.mark.category("security")
    @pytest.mark.priority("P2")
    def test_no_internal_ips(self, sec_session: requests.Session, base_url: str) -> None:
        resp = sec_session.get(f"{base_url}/get", timeout=10)
        ip_pattern = re.compile(
            r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
            r"|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
            r"|192\.168\.\d{1,3}\.\d{1,3}"
            r"|127\.\d{1,3}\.\d{1,3}\.\d{1,3})\b"
        )
        for key, value in resp.headers.items():
            assert not ip_pattern.search(value), (
                f"Header {key} leaks internal IP: {value}"
            )

    @pytest.mark.category("security")
    @pytest.mark.priority("P1")
    def test_content_type_options(self, sec_session: requests.Session, base_url: str) -> None:
        resp = sec_session.get(
            f"{base_url}/response-headers?X-Content-Type-Options=nosniff", timeout=10
        )
        val = resp.headers.get("X-Content-Type-Options", "")
        if val:
            assert val.lower() == "nosniff", (
                f"X-Content-Type-Options is not nosniff: {val}"
            )

    @pytest.mark.category("security")
    @pytest.mark.priority("P1")
    def test_strict_transport_security(self, sec_session: requests.Session, base_url: str) -> None:
        resp = sec_session.get(
            f"{base_url}/response-headers?"
            "Strict-Transport-Security=max-age%3D31536000%3B+includeSubDomains",
            timeout=10,
        )
        val = resp.headers.get("Strict-Transport-Security", "")
        if val:
            match = re.search(r"max-age=(\d+)", val)
            assert match, f"HSTS header missing max-age directive: {val}"
            assert int(match.group(1)) >= 31536000, (
                f"HSTS max-age {match.group(1)} is below minimum 31536000"
            )

    @pytest.mark.category("security")
    @pytest.mark.priority("P1")
    def test_referrer_policy(self, sec_session: requests.Session, base_url: str) -> None:
        resp = sec_session.get(
            f"{base_url}/response-headers?Referrer-Policy=strict-origin-when-cross-origin",
            timeout=10,
        )
        val = resp.headers.get("Referrer-Policy", "")
        strict_policies = {
            "no-referrer", "same-origin", "strict-origin",
            "strict-origin-when-cross-origin", "no-referrer-when-downgrade",
        }
        if val:
            assert val.lower() in strict_policies, (
                f"Referrer-Policy {val} is not strict enough"
            )

    @pytest.mark.category("security")
    @pytest.mark.priority("P1")
    def test_secure_cookies(self, sec_session: requests.Session, base_url: str) -> None:
        resp = sec_session.get(f"{base_url}/cookies/set?test=value", timeout=10)
        for cookie in resp.cookies:
            if hasattr(cookie, "rest") and cookie.rest.get("HttpOnly"):
                continue

    @pytest.mark.category("security")
    @pytest.mark.priority("P1")
    def test_csp_header(self, sec_session: requests.Session, base_url: str) -> None:
        csp_val = "default-src%20'self'%3B%20script-src%20'self'%3B%20object-src%20'none'"
        resp = sec_session.get(
            f"{base_url}/response-headers?Content-Security-Policy={csp_val}",
            timeout=10,
        )
        val = resp.headers.get("Content-Security-Policy", "")
        if val:
            required = ["default-src", "script-src", "object-src"]
            for directive in required:
                assert directive in val, (
                    f"CSP missing required directive '{directive}'"
                )
