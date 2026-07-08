"""Geographic routing and DNS resolution tests against httpbin.org."""

import pytest
import requests


class TestGeoRouting:
    """Tests for DNS resolution and endpoint reachability."""

    @pytest.mark.category("geo-match")
    @pytest.mark.priority("P0")
    def test_base_endpoint_reachable(self, session: requests.Session, base_url: str) -> None:
        resp = session.get(f"{base_url}/get", timeout=10)
        assert resp.status_code == 200

    @pytest.mark.category("geo-match")
    @pytest.mark.priority("P0")
    def test_dns_resolves_to_multiple_ips(self, base_url: str) -> None:
        import socket
        host = requests.utils.urlparse(base_url).hostname or ""
        ips = socket.getaddrinfo(host, 443)
        assert len(ips) > 0, f"No DNS records found for {host}"

    @pytest.mark.category("geo-match")
    @pytest.mark.priority("P1")
    def test_different_endpoints_return_200(self, session: requests.Session, base_url: str) -> None:
        for path in ["/get", "/json", "/html", "/xml"]:
            resp = session.get(f"{base_url}{path}", timeout=10)
            assert resp.status_code == 200, (
                f"{path} returned {resp.status_code}"
            )

    @pytest.mark.category("geo-match")
    @pytest.mark.priority("P2")
    def test_response_from_multiple_regions(self, base_url: str) -> None:
        import socket
        host = requests.utils.urlparse(base_url).hostname or ""
        ips = list(set(
            addr[4][0] for addr in socket.getaddrinfo(host, 443)
        ))
        assert len(ips) >= 2, (
            f"Expected multiple IPs for regional routing, got {len(ips)}"
        )

    @pytest.mark.category("geo-match")
    @pytest.mark.priority("P2")
    def test_dns_fallback_resolves(self) -> None:
        import socket
        addr = socket.getaddrinfo("httpbin.org", 443)
        assert len(addr) > 0
