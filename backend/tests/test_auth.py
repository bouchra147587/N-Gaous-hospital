from tests.conftest import signup


def test_signup_creates_citizen(client):
    res = signup(client)
    assert res.status_code == 201
    body = res.json()
    assert body["user"]["role"] == "citizen"
    assert "access_token" in body
    assert "password" not in body["user"]
    assert "hashed_password" not in body["user"]


def test_signup_cannot_grant_admin_role(client):
    res = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Sneaky",
            "email": "sneaky@example.com",
            "password": "password123",
            "role": "admin",
        },
    )
    assert res.status_code == 201
    assert res.json()["user"]["role"] == "citizen"


def test_duplicate_email_signup_rejected(client):
    signup(client, email="dupe@example.com")
    res = signup(client, email="dupe@example.com")
    assert res.status_code == 409


def test_login_success(client):
    signup(client, email="login@example.com", password="password123")
    res = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "login@example.com"


def test_login_invalid_password(client):
    signup(client, email="badpass@example.com", password="password123")
    res = client.post(
        "/api/auth/login",
        json={"email": "badpass@example.com", "password": "wrongpassword"},
    )
    assert res.status_code == 401


def test_login_unknown_email(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "password123"},
    )
    assert res.status_code == 401


def test_current_user_requires_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_current_user_returns_authenticated_user(client):
    body = signup(client, email="me@example.com").json()
    token = body["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"


def test_passwords_are_never_stored_in_plaintext(client, db):
    signup(client, email="hash@example.com", password="password123")
    from app.models.user import User

    user = db.query(User).filter(User.email == "hash@example.com").first()
    assert user is not None
    assert user.hashed_password != "password123"
    assert user.hashed_password.startswith("$argon2")
