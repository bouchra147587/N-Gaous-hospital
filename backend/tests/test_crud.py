from tests.conftest import make_admin


def get_admin_token(client, db):
    make_admin(db, email="crud-admin@example.com", password="password123")
    res = client.post(
        "/api/auth/login", json={"email": "crud-admin@example.com", "password": "password123"}
    )
    return res.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_create_update_delete_department(client, db):
    token = get_admin_token(client, db)
    create = client.post(
        "/api/admin/departments",
        json={"name_ar": "الجراحة", "slug": "surgery"},
        headers=auth_headers(token),
    )
    assert create.status_code == 201
    dept_id = create.json()["id"]

    update = client.put(
        f"/api/admin/departments/{dept_id}",
        json={"name_en": "Surgery"},
        headers=auth_headers(token),
    )
    assert update.status_code == 200
    assert update.json()["name_en"] == "Surgery"

    delete = client.delete(f"/api/admin/departments/{dept_id}", headers=auth_headers(token))
    assert delete.status_code == 200

    public_list = client.get("/api/departments")
    assert all(d["id"] != dept_id for d in public_list.json())


def test_duplicate_slug_rejected(client, db):
    token = get_admin_token(client, db)
    client.post(
        "/api/admin/departments", json={"name_ar": "أ", "slug": "dup"}, headers=auth_headers(token)
    )
    second = client.post(
        "/api/admin/departments", json={"name_ar": "ب", "slug": "dup"}, headers=auth_headers(token)
    )
    assert second.status_code == 409


def test_delete_department_with_doctors_requires_force(client, db):
    token = get_admin_token(client, db)
    dept = client.post(
        "/api/admin/departments", json={"name_ar": "قسم", "slug": "with-doctors"}, headers=auth_headers(token)
    ).json()
    client.post(
        "/api/admin/doctors",
        json={"full_name_ar": "طبيب", "department_id": dept["id"]},
        headers=auth_headers(token),
    )
    blocked = client.delete(f"/api/admin/departments/{dept['id']}", headers=auth_headers(token))
    assert blocked.status_code == 409

    forced = client.delete(
        f"/api/admin/departments/{dept['id']}?force=true", headers=auth_headers(token)
    )
    assert forced.status_code == 200


def test_create_doctor(client, db):
    token = get_admin_token(client, db)
    res = client.post(
        "/api/admin/doctors",
        json={"full_name_ar": "د. محمد", "specialty": "قلبية"},
        headers=auth_headers(token),
    )
    assert res.status_code == 201
    assert res.json()["full_name_ar"] == "د. محمد"


def test_create_service(client, db):
    token = get_admin_token(client, db)
    res = client.post(
        "/api/admin/services",
        json={"title_ar": "خدمة", "available_24_7": True},
        headers=auth_headers(token),
    )
    assert res.status_code == 201
    assert res.json()["available_24_7"] is True


def test_create_news_and_public_only_sees_published(client, db):
    token = get_admin_token(client, db)
    draft = client.post(
        "/api/admin/news",
        json={"title_ar": "خبر مسودة", "is_published": False},
        headers=auth_headers(token),
    ).json()
    published = client.post(
        "/api/admin/news",
        json={"title_ar": "خبر منشور", "is_published": True},
        headers=auth_headers(token),
    ).json()

    public_list = client.get("/api/news").json()
    ids = [n["id"] for n in public_list]
    assert published["id"] in ids
    assert draft["id"] not in ids
