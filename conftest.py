import pytest

def pytest_configure(config):
    config.addinivalue_line("markers", "suite_continuous: smoke tests run every 30min")
