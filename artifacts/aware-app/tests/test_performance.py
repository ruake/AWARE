"""Performance test suite for HTTP response timing and compression."""

import time
import concurrent.futures
import urllib.request
import urllib.error
import pytest
from typing import Callable


TEST_URL = "https://httpbin.org"
LARGE_FILE_URL = f"{TEST_URL}/bytes/1048576"
COMPRESSIBLE_URL = f"{TEST_URL}/gzip"
TIMEOUT_SECONDS = 30


def _fetch_url(
    url: str,
    method: str = "GET",
) -> tuple[int, bytes, dict[str, str]]:
    req = urllib.request.Request(url, method=method)
    ctx = urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS)
    data = ctx.read()
    headers = dict(ctx.headers.items())
    return ctx.status, data, headers


def _timed_fetch(url: str) -> tuple[float, int, bytes, dict[str, str]]:
    start = time.perf_counter()
    status, data, headers = _fetch_url(url)
    elapsed = time.perf_counter() - start
    return elapsed, status, data, headers


@pytest.fixture(scope="module")
def live_check() -> bool:
    try:
        _fetch_url(f"{TEST_URL}/get")
        return True
    except (urllib.error.URLError, OSError):
        return False


class TestTimeToFirstByte:
    """Tests measuring time to first byte (TTFB)."""

    @pytest.mark.category("performance")
    @pytest.mark.priority("P0")
    def test_ttfb_under_500ms(self, live_check: bool) -> None:
        elapsed, status, data, _ = _timed_fetch(f"{TEST_URL}/get")
        assert elapsed < 0.5, f"TTFB {elapsed*1000:.1f}ms exceeded 500ms"

    @pytest.mark.category("performance")
    @pytest.mark.priority("P0")
    def test_download_speed(self, live_check: bool) -> None:
        elapsed, status, data, _ = _timed_fetch(LARGE_FILE_URL)
        size_mb = len(data) / (1024 * 1024)
        speed_mbps = (size_mb * 8) / elapsed if elapsed > 0 else 0
        assert elapsed < 10.0, (
            f"Download of 1MB took {elapsed:.1f}s "
            f"({speed_mbps:.1f} Mbps)"
        )

    @pytest.mark.category("performance")
    @pytest.mark.priority("P1")
    def test_connection_time(self, live_check: bool) -> None:
        import socket
        host = "httpbin.org"
        port = 443
        start = time.perf_counter()
        with socket.create_connection((host, port), timeout=TIMEOUT_SECONDS):
            elapsed = time.perf_counter() - start
        assert elapsed < 0.2, (
            f"TCP connection to {host}:{port} took {elapsed*1000:.1f}ms"
        )

    @pytest.mark.category("performance")
    @pytest.mark.priority("P2")
    def test_keep_alive(self, live_check: bool) -> None:
        first_elapsed, _, _, _ = _timed_fetch(f"{TEST_URL}/get")
        second_elapsed, _, _, _ = _timed_fetch(f"{TEST_URL}/get")
        assert second_elapsed < first_elapsed * 1.5 or second_elapsed < 0.3, (
            f"Keep-alive not effective: first={first_elapsed*1000:.1f}ms, "
            f"second={second_elapsed*1000:.1f}ms"
        )


class TestConcurrentRequests:
    """Tests for concurrent request handling."""

    @pytest.mark.category("performance")
    @pytest.mark.priority("P1")
    def test_multiple_sequential_requests(self, live_check: bool) -> None:
        count = 10
        times: list[float] = []
        for _ in range(count):
            elapsed, _, _, _ = _timed_fetch(f"{TEST_URL}/get")
            times.append(elapsed)
        avg = sum(times) / len(times)
        assert avg < 1.0, (
            f"Average sequential response time {avg*1000:.1f}ms "
            f"exceeded 1000ms"
        )

    @pytest.mark.category("performance")
    @pytest.mark.priority("P1")
    def test_concurrent_requests(self, live_check: bool) -> None:
        def fetch_one(idx: int) -> tuple[int, int, float]:
            start = time.perf_counter()
            try:
                _, data, _ = _fetch_url(f"{TEST_URL}/get")
                elapsed = time.perf_counter() - start
                return idx, len(data), elapsed
            except Exception as exc:
                raise AssertionError(f"Request {idx} failed: {exc}")

        concurrency = 5
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
            futs = [pool.submit(fetch_one, i) for i in range(concurrency)]
            completed = [
                f.result(timeout=TIMEOUT_SECONDS) for f in
                concurrent.futures.as_completed(futs, timeout=TIMEOUT_SECONDS)
            ]
        assert len(completed) == concurrency, (
            f"Only {len(completed)} of {concurrency} concurrent requests completed"
        )


class TestCompressionAndCaching:
    """Tests for HTTP compression behavior."""

    @pytest.mark.category("performance")
    @pytest.mark.priority("P1")
    def test_compression_active(self, live_check: bool) -> None:
        req = urllib.request.Request(
            COMPRESSIBLE_URL,
            headers={"Accept-Encoding": "gzip"},
        )
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            raw = resp.read()
        encoding = resp.headers.get("Content-Encoding", "")
        assert encoding.lower() in ("gzip", "br", "deflate"), (
            f"Compression not active: Content-Encoding={encoding!r}"
        )

    @pytest.mark.category("performance")
    @pytest.mark.priority("P1")
    def test_cache_improves_response_time(self, live_check: bool) -> None:
        url = f"{TEST_URL}/cache"
        first_elapsed, first_status, first_data, _ = _timed_fetch(url)
        second_elapsed, second_status, second_data, _ = _timed_fetch(url)
        assert second_elapsed < first_elapsed or second_elapsed < 0.3, (
            f"Cache did not improve response time: "
            f"first={first_elapsed*1000:.1f}ms, "
            f"second={second_elapsed*1000:.1f}ms"
        )

    @pytest.mark.category("performance")
    @pytest.mark.priority("P2")
    def test_response_size_headers(self, live_check: bool) -> None:
        _, _, headers = _fetch_url(
            f"{TEST_URL}/response-headers?key1=value1&key2=value2"
        )
        header_size = sum(len(k) + len(v) + 2 for k, v in headers.items())
        assert header_size < 8192, (
            f"Total response header size {header_size}B exceeded 8KB limit"
        )
