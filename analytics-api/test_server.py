"""Regression checks for privacy-thresholded city and country analytics."""

from __future__ import annotations

import os
import tempfile
import unittest

import server


class LocationDashboardTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        server.DB_PATH = os.path.join(self.temp_dir.name, "analytics.sqlite3")
        server.PRIVACY_THRESHOLD = 5
        server.rate_buckets.clear()
        os.environ["ANALYTICS_SECRET"] = "test-secret-" * 4
        server.initialize()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()
        os.environ.pop("ANALYTICS_SECRET", None)

    def collect_sessions(self, city: str, count: int, offset: int) -> None:
        for index in range(offset, offset + count):
            status, _ = server.collect(
                {
                    "event": "page_view",
                    "path": "/works",
                    "title": "Works",
                    "sessionId": f"session-{index:03d}",
                    "screenWidth": 390,
                },
                {
                    "user-agent": f"Mozilla/5.0 test-{index}",
                    "cf-connecting-ip": f"198.51.100.{index}",
                    "cf-ipcountry": "ID",
                    "cf-region-code": "JB",
                    "cf-ipcity": city,
                },
            )
            self.assertEqual(status, 202)

    def test_city_country_locations_use_the_public_threshold(self) -> None:
        self.collect_sessions("Jakarta", 5, 1)
        self.collect_sessions("Bandung", 5, 11)
        self.collect_sessions("Surabaya", 4, 21)
        self.collect_sessions("", 5, 31)

        payload = server.dashboard("all")
        locations = payload["locations"]

        self.assertEqual(
            [(item["city"], item["country"], item["sessions"]) for item in locations],
            [("Bandung", "ID", 5), ("Jakarta", "ID", 5), (None, "ID", 5)],
        )
        self.assertNotIn("Surabaya", {item["city"] for item in locations})
        self.assertIn(
            {"city": "Jakarta", "region": "JB", "country": "ID", "sessions": 5},
            payload["cities"],
        )


if __name__ == "__main__":
    unittest.main()
