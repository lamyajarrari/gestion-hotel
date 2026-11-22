"""Test de bout en bout contre l'API housekeeping réelle + les faux services.
Bibliothèque standard uniquement : python dev/smoke_test.py

Variables (valeurs par défaut = celles du docker-compose.dev.yml) :
  HK_URL, MOCK_URL, JWT_SECRET, INTERNAL_API_TOKEN
"""
import base64
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.error
import urllib.request

HK = os.getenv("HK_URL", "http://localhost:8003").rstrip("/") + "/api/housekeeping"
MOCK = os.getenv("MOCK_URL", "http://localhost:9000").rstrip("/")
SECRET = os.getenv("JWT_SECRET", "change_me_commun_a_tous_les_services")
INTERNAL = os.getenv("INTERNAL_API_TOKEN", "change_me_interne")


def b64(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=")


def jwt_hs256(role, user_id="1"):
    header = b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = b64(json.dumps({"user_id": user_id, "role": role, "exp": int(time.time()) + 3600}).encode())
    sig = b64(hmac.new(SECRET.encode(), header + b"." + payload, hashlib.sha256).digest())
    return (header + b"." + payload + b"." + sig).decode()


def call(method, url, body=None, token=None, headers=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


results = []


def check(name, got, expected):
    ok = got == expected
    results.append(ok)
    print(f"[{'OK ' if ok else 'ECHEC'}] {name} -> {got}" + ("" if ok else f" (attendu {expected})"))


def main():
    admin = jwt_hs256("GESTIONNAIRE")
    client = jwt_hs256("CLIENT", "9")
    body = lambda chambre, agent, type_: {  # noqa: E731
        "chambre_id": chambre, "agent_id": agent, "type": type_, "date_prevue": "2026-11-07"
    }

    check("health public", call("GET", f"{HK}/health/")[0], 200)
    check("sans jeton", call("GET", f"{HK}/services/")[0], 401)
    check("jeton client refusé", call("GET", f"{HK}/services/", token=client)[0], 403)

    code, svc = call("POST", f"{HK}/services/", body("2", "7", "DEPART"), admin)
    check("assigner départ chambre 2 (à nettoyer)", code, 201)
    sid = svc.get("id")
    check("2e assignation même chambre refusée", call("POST", f"{HK}/services/", body("2", "7", "DEPART"), admin)[0], 409)
    check("terminer sans démarrer refusé", call("POST", f"{HK}/services/{sid}/terminer/", token=admin)[0], 409)
    check("démarrer", call("POST", f"{HK}/services/{sid}/demarrer/", token=admin)[0], 200)
    check("démarrer 2 fois refusé", call("POST", f"{HK}/services/{sid}/demarrer/", token=admin)[0], 409)
    check("terminer", call("POST", f"{HK}/services/{sid}/terminer/", token=admin)[0], 200)

    _, chambre = call("GET", f"{MOCK}/api/internal/chambres/2/", headers={"X-Internal-Token": INTERNAL})
    check("chambre 2 passée à « disponible »", chambre.get("etat"), "disponible")

    check("départ sur chambre libre refusé", call("POST", f"{HK}/services/", body("3", "7", "DEPART"), admin)[0], 409)
    check("agent inactif refusé", call("POST", f"{HK}/services/", body("4", "8", "DEPART"), admin)[0], 409)
    check("utilisateur non agent refusé", call("POST", f"{HK}/services/", body("4", "9", "DEPART"), admin)[0], 400)
    check("chambre inconnue", call("POST", f"{HK}/services/", body("99", "7", "DEPART"), admin)[0], 404)
    check("quotidien sur chambre occupée", call("POST", f"{HK}/services/", body("1", "7", "QUOTIDIEN"), admin)[0], 201)

    code, a_nettoyer = call("GET", f"{HK}/services/chambres-a-nettoyer/", token=admin)
    check("chambres à nettoyer (reste la 4)", (code, [c["id"] for c in a_nettoyer]), (200, ["4"]))

    code, hist = call("GET", f"{HK}/services/?statut=TERMINE", token=admin)
    check("historique : 1 service terminé", (code, hist.get("count")), (200, 1))

    ok = all(results)
    print(f"\n{sum(results)}/{len(results)} vérifications réussies.")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
