import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")

from app.routes.telemetry import TelemetryErrorReport, ingest_client_error  # noqa: E402
from main import app  # noqa: E402


class TestTelemetryRoutes(unittest.IsolatedAsyncioTestCase):
    def test_telemetry_routes_mounted_on_root_and_api_prefix(self):
        route_paths = {getattr(r, "path", None) for r in app.routes}
        self.assertIn("/telemetry/errors", route_paths)
        self.assertIn("/api/telemetry/errors", route_paths)

    async def test_ingest_client_error_persists_to_mongodb(self):
        mock_insert = AsyncMock(return_value=None)
        payload = TelemetryErrorReport(
            name="TypeError",
            message="Cannot read properties of undefined",
            stack="TypeError: at foo.jsx:10",
            source="react_error_boundary",
            level="fatal",
            route="/matches",
            user_id="65f123abc4567890",
        )
        fake_req = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"))

        with patch("app.routes.telemetry.error_logs_collection.insert_one", new=mock_insert):
            res = await ingest_client_error(payload, fake_req)

        self.assertEqual(res, {"status": "recorded", "persisted": True})
        mock_insert.assert_awaited_once()
        inserted_doc = mock_insert.await_args.args[0]
        self.assertEqual(inserted_doc["source"], "react_error_boundary")
        self.assertEqual(inserted_doc["level"], "fatal")
        self.assertEqual(inserted_doc["client_ip"], "127.0.0.1")

    async def test_ingest_client_error_survives_db_failure(self):
        mock_insert = AsyncMock(side_effect=RuntimeError("Mongo down"))
        payload = TelemetryErrorReport(
            message="Network timeout",
            source="api_interceptor",
        )
        fake_req = SimpleNamespace(client=None)

        with patch("app.routes.telemetry.error_logs_collection.insert_one", new=mock_insert):
            res = await ingest_client_error(payload, fake_req)

        self.assertEqual(res, {"status": "recorded", "persisted": False})


if __name__ == "__main__":
    unittest.main()
