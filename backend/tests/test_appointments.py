from tests.conftest import signup


def test_citizen_can_create_appointment_anonymously(client):
    res = client.post(
        "/api/appointments",
        json={"full_name": "Anon Patient", "phone": "0555111222"},
    )
    assert res.status_code == 201
    assert res.json()["status"] == "pending"
    assert res.json()["user_id"] is None


def test_authenticated_citizen_appointment_linked_to_account(client):
    token = signup(client, email="patient@example.com").json()["access_token"]
    res = client.post(
        "/api/appointments",
        json={"full_name": "Patient", "phone": "0555111222"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201

    mine = client.get("/api/appointments/me", headers={"Authorization": f"Bearer {token}"})
    assert mine.status_code == 200
    assert len(mine.json()) == 1


def test_citizen_cannot_view_or_cancel_another_users_appointment(client):
    token_a = signup(client, email="a@example.com", full_name="User A").json()["access_token"]
    token_b = signup(client, email="b@example.com", full_name="User B").json()["access_token"]

    appt = client.post(
        "/api/appointments",
        json={"full_name": "User A", "phone": "0555000000"},
        headers={"Authorization": f"Bearer {token_a}"},
    ).json()

    # B has no appointments of their own
    mine_b = client.get("/api/appointments/me", headers={"Authorization": f"Bearer {token_b}"})
    assert mine_b.json() == []

    # B cannot cancel A's appointment
    cancel = client.delete(
        f"/api/appointments/{appt['id']}", headers={"Authorization": f"Bearer {token_b}"}
    )
    assert cancel.status_code == 403


def test_owner_can_cancel_their_own_appointment(client):
    token = signup(client, email="owner@example.com").json()["access_token"]
    appt = client.post(
        "/api/appointments",
        json={"full_name": "Owner", "phone": "0555000000"},
        headers={"Authorization": f"Bearer {token}"},
    ).json()
    cancel = client.delete(
        f"/api/appointments/{appt['id']}", headers={"Authorization": f"Bearer {token}"}
    )
    assert cancel.status_code == 200
