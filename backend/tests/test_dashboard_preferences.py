import os
import sys
import unittest
from unittest.mock import patch

from bson import ObjectId
from fastapi import HTTPException

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.models import DashboardPreferences
from app.routes import users as users_route


class FakeUsersCollection:
    """Colección Mongo en memoria para probar preferencias de dashboard sin BD externa."""

    def __init__(self, initial_docs=None):
        self.docs = list(initial_docs or [])

    def _match(self, doc, query):
        for k, v in (query or {}).items():
            if doc.get(k) != v:
                return False
        return True

    async def find_one(self, query):
        for d in self.docs:
            if self._match(d, query):
                return dict(d)
        return None

    async def update_one(self, query, update):
        for idx, d in enumerate(self.docs):
            if self._match(d, query):
                if "$set" in update:
                    updated = dict(d)
                    for k, v in update["$set"].items():
                        updated[k] = v
                    self.docs[idx] = updated
                return


class TestDashboardPreferencesRoutes(unittest.IsolatedAsyncioTestCase):
    async def test_get_and_put_dashboard_preferences_by_object_id_and_firebase_uid(self):
        oid = ObjectId()
        fake_users = FakeUsersCollection([
            {
                "_id": oid,
                "firebase_uid": "fb_coach_123",
                "email": "coach@handtix.pro",
                "name": "Coach Handtix",
                "saved_teams": [],
            }
        ])

        sample_prefs = DashboardPreferences(
            version=1,
            activePreset="head_coach",
            matchDashboard={
                "organization": "unified",
                "density": "compact",
                "tabs": [{"id": "dashboard", "visible": True}],
                "widgets": [{"id": "kpi_off_eff", "visible": True, "size": "md", "height": "normal"}],
            },
            teamDashboard={
                "organization": "grouped",
                "density": "normal",
                "widgets": [{"id": "team_kpi_goals", "visible": True, "size": "sm", "height": "normal"}],
            },
            updatedAt="2026-11-11T12:00:00Z",
        )

        with patch.object(users_route, "user_collection", fake_users):
            initial = await users_route.get_dashboard_preferences(str(oid))
            self.assertIsNone(initial["dashboard_preferences"])

            saved = await users_route.update_dashboard_preferences(str(oid), sample_prefs)
            self.assertEqual(saved["dashboard_preferences"]["activePreset"], "head_coach")
            self.assertEqual(saved["dashboard_preferences"]["matchDashboard"]["organization"], "unified")

            fetched_by_uid = await users_route.get_dashboard_preferences("fb_coach_123")
            self.assertIsNotNone(fetched_by_uid["dashboard_preferences"])
            self.assertEqual(
                fetched_by_uid["dashboard_preferences"]["matchDashboard"]["density"],
                "compact",
            )

    async def test_dashboard_preferences_returns_404_for_missing_user(self):
        fake_users = FakeUsersCollection([])

        with patch.object(users_route, "user_collection", fake_users):
            with self.assertRaises(HTTPException) as get_err:
                await users_route.get_dashboard_preferences(str(ObjectId()))
            self.assertEqual(get_err.exception.status_code, 404)

            with self.assertRaises(HTTPException) as put_err:
                await users_route.update_dashboard_preferences(
                    "missing_uid",
                    DashboardPreferences(activePreset="minimalist"),
                )
            self.assertEqual(put_err.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()

