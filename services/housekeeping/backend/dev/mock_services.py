"""Faux services CHAMBRES et USERS pour tester housekeeping sans attendre les autres membres.
Données en mémoire, aucune dépendance (bibliothèque standard uniquement).

Chambres (routes /api/internal/... et /api/admin/..., champ « etat ») : 1 occupee | 2 a_nettoyer | 3 disponible | 4 a_nettoyer | 5 maintenance
Users    : 1 gestionnaire | 7 agent ACTIF | 8 agent INACTIF | 9 client
"""
import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

TOKEN = os.getenv("INTERNAL_API_TOKEN", "change_me_interne")
PORT = int(os.getenv("PORT", "9000"))
ETATS = {"disponible", "occupee", "a_nettoyer", "maintenance"}

CHAMBRES = {
    "1": {"id": "1", "numero": "101", "etat": "occupee"},
    "2": {"id": "2", "numero": "102", "etat": "a_nettoyer"},
    "3": {"id": "3", "numero": "103", "etat": "disponible"},
    "4": {"id": "4", "numero": "104", "etat": "a_nettoyer"},
    "5": {"id": "5", "numero": "105", "etat": "maintenance"},
}
USERS = {
    "1": {"id": "1", "role": "GESTIONNAIRE", "statut": "ACTIF"},
    "7": {"id": "7", "role": "AGENT_MENAGE", "statut": "ACTIF"},
    "8": {"id": "8", "role": "AGENT_MENAGE", "statut": "INACTIF"},
    "9": {"id": "9", "role": "CLIENT", "statut": "ACTIF"},
}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body=None):
        data = json.dumps(body if body is not None else {}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _auth_ok(self):
        if self.headers.get("X-Internal-Token") != TOKEN:
            self._send(403, {"detail": "Jeton interne invalide."})
            return False
        return True

    def _admin_ok(self):
        # Le vrai service chambres vérifie le JWT et le rôle ; ici on exige seulement un Bearer.
        if not self.headers.get("Authorization", "").startswith("Bearer "):
            self._send(401, {"detail": "Authentification requise."})
            return False
        return True

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/health/":
            return self._send(200, {"status": "ok", "service": "mock"})

        # chambres : liste admin paginée (JWT), comme /api/admin/chambres/ du vrai service
        if url.path == "/api/admin/chambres/":
            if not self._admin_ok():
                return
            etat = parse_qs(url.query).get("etat", [None])[0]
            items = [c for c in CHAMBRES.values() if not etat or c["etat"] == etat]
            return self._send(200, {"count": len(items), "next": None, "previous": None,
                                    "results": items})

        # chambres : route interne (X-Internal-Token)
        m = re.fullmatch(r"/api/internal/chambres/([^/]+)/", url.path)
        if m:
            if not self._auth_ok():
                return
            c = CHAMBRES.get(m.group(1))
            return self._send(200, c) if c else self._send(404, {"detail": "Introuvable."})

        # users
        m = re.fullmatch(r"/api/users/([^/]+)/", url.path)
        if m:
            if not self._auth_ok():
                return
            u = USERS.get(m.group(1))
            return self._send(200, u) if u else self._send(404, {"detail": "Introuvable."})
        self._send(404, {"detail": "Route inconnue."})

    def do_POST(self):
        if not self._auth_ok():
            return
        m = re.fullmatch(r"/api/internal/chambres/([^/]+)/etat/", urlparse(self.path).path)
        if not m:
            return self._send(404, {"detail": "Route inconnue."})
        chambre = CHAMBRES.get(m.group(1))
        if not chambre:
            return self._send(404, {"detail": "Introuvable."})
        length = int(self.headers.get("Content-Length", 0))
        try:
            etat = json.loads(self.rfile.read(length) or b"{}").get("etat")
        except json.JSONDecodeError:
            etat = None
        if etat not in ETATS:
            return self._send(400, {"etat": "Valeur invalide."})
        chambre["etat"] = etat
        self._send(200, chambre)

    def log_message(self, fmt, *args):
        print("[mock]", fmt % args, flush=True)


if __name__ == "__main__":
    print(f"Mock chambres/users sur le port {PORT}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
