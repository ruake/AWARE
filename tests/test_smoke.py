import pytest
import requests


@pytest.mark.suite_continuous
class TestSmoke:
    def test_homepage_200(self):
        url = pytest.importorskip("os").environ.get("BASE_URL", "https://www.akamai.com")
        res = requests.get(url, timeout=10)
        assert res.status_code == 200

    def test_homepage_content(self):
        url = pytest.importorskip("os").environ.get("BASE_URL", "https://www.akamai.com")
        res = requests.get(url, timeout=10)
        assert "Akamai" in res.text
