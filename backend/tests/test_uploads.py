import io

from tests.conftest import make_admin, signup

# Smallest valid PNG (1x1 pixel)
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d4944415478da63fcffff3f0300050001a5f645400000000049454e44ae426082"
)


def admin_headers(client, db):
    make_admin(db, email="up-admin@example.com", password="password123")
    token = client.post(
        "/api/auth/login", json={"email": "up-admin@example.com", "password": "password123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_admin_can_upload_image(client, db):
    res = client.post(
        "/api/admin/uploads",
        files={"file": ("photo.png", io.BytesIO(PNG_BYTES), "image/png")},
        headers=admin_headers(client, db),
    )
    assert res.status_code == 200
    url = res.json()["url"]
    assert url.startswith("/media/uploads/") and url.endswith(".png")
    # and the file is actually served back
    assert client.get(url).status_code == 200


def test_upload_rejects_non_image(client, db):
    res = client.post(
        "/api/admin/uploads",
        files={"file": ("evil.txt", io.BytesIO(b"hello"), "text/plain")},
        headers=admin_headers(client, db),
    )
    assert res.status_code == 400


def test_citizen_cannot_upload(client):
    token = signup(client, email="cit@example.com").json()["access_token"]
    res = client.post(
        "/api/admin/uploads",
        files={"file": ("photo.png", io.BytesIO(PNG_BYTES), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


def test_upload_requires_auth(client):
    res = client.post(
        "/api/admin/uploads",
        files={"file": ("photo.png", io.BytesIO(PNG_BYTES), "image/png")},
    )
    assert res.status_code == 401
