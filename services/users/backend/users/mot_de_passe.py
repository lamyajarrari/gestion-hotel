def erreurs_mot_de_passe(mot_de_passe, email="", nom="", prenom=""):
    erreurs = []
    if len(mot_de_passe) < 8:
        erreurs.append("Au moins 8 caractères.")
    if not any(c.islower() for c in mot_de_passe):
        erreurs.append("Au moins une minuscule.")
    if not any(c.isupper() for c in mot_de_passe):
        erreurs.append("Au moins une majuscule.")
    if not any(c.isdigit() for c in mot_de_passe):
        erreurs.append("Au moins un chiffre.")
    if not any(not c.isalnum() for c in mot_de_passe):
        erreurs.append("Au moins un caractère spécial (! @ # $ % ...).")

    bas = mot_de_passe.lower()
    morceaux = [email.split("@")[0], nom, prenom]
    for morceau in morceaux:
        morceau = morceau.strip().lower()
        if len(morceau) >= 3 and morceau in bas:
            erreurs.append("Ne doit contenir ni votre e-mail, ni votre nom, ni votre prénom.")
            break
    return erreurs