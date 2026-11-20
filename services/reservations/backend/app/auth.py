import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

schema_bearer = HTTPBearer(auto_error=False)


def verifier_jeton(
    credentials: HTTPAuthorizationCredentials | None = Depends(schema_bearer),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Jeton manquant.")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=["HS256"],
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Jeton invalide ou expiré.")

    if "sub" not in payload:
        raise HTTPException(status_code=401, detail="Jeton invalide.")

    return payload