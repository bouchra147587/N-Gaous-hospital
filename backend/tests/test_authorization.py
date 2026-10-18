from tests.conftest import make_admin, signup


def admin_token(client, db):
    make_admin(db, email="boss@example.com", password="password123")
    res = client.post("/api/auth/login", json={"email": "boss@example.com", "password": "password123"})
    return res.json()["access_token"]


def citizen_token(client):
    return signup(client, email="joe@example.com").json()["access_token"]


def test_citizen_cannot_access_admin_endpoint(client, db):
    token = citizen_token(client)
    res = client.get("/api/admin/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_unauthenticated_cannot_access_admin_endpoint(client):
    res = client.get("/api/admin/dashboard/stats")
    assert res.status_code == 401


def test_admin_can_access_admin_endpoint(client, db):
    token = admin_token(client, db)
    res = client.get("/api/admin/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "doctors" in res.json()


def test_citizen_cannot_create_department(client, db):
    token = citizen_token(client)
    res = client.post(
        "/api/admin/departments",
        json={"name_ar": "قسم", "slug": "test-dept"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


def test_admin_can_create_department(client, db):
    token = admin_token(client, db)
    res = client.post(
        "/api/admin/departments",
        json={"name_ar": "قسم", "slug": "test-dept"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    assert res.json()["slug"] == "test-dept"
