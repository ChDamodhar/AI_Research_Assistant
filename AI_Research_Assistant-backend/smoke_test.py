import urllib.request, json, urllib.error

BASE = "http://localhost:8000"

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        r = urllib.request.urlopen(req)
        return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

def get(url, token=None):
    headers = {"Authorization": "Bearer " + token} if token else {}
    req = urllib.request.Request(url, headers=headers)
    try:
        r = urllib.request.urlopen(req)
        return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

print("--- TEST 1: Register ---")
body, status = post(BASE + "/api/auth/register", {"name": "Bharath Kumar", "email": "bharath@test.com", "password": "secure123"})
print("Status:", status)
print("Success:", body.get("success"))
print("Message:", body.get("message"))

print()
print("--- TEST 2: Login ---")
body, status = post(BASE + "/api/auth/login", {"email": "bharath@test.com", "password": "secure123"})
print("Status:", status)
token = body.get("token", {}).get("access_token", "")
print("Token received:", bool(token))

print()
print("--- TEST 3: Get Profile ---")
body, status = get(BASE + "/api/auth/profile", token)
print("Status:", status)
print("Name:", body.get("name"))
print("Email:", body.get("email"))

print()
print("--- TEST 4: Dashboard ---")
body, status = get(BASE + "/api/dashboard", token)
print("Status:", status)
print("Stats:", json.dumps(body.get("data"), indent=2))

print()
print("--- TEST 5: List Papers ---")
body, status = get(BASE + "/api/papers", token)
print("Status:", status)
print("Total papers:", body.get("total"))

print()
print("ALL SMOKE TESTS PASSED")
