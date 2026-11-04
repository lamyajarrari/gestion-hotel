from rest_framework import serializers

from .models import Chambre


class ChambreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chambre
        fields = ["id", "numero", "type", "capacite", "tarif", "etat", "actif"]
        read_only_fields = ["etat", "actif"]