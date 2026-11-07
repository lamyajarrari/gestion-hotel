from rest_framework import serializers

from .models import Chambre, Indisponibilite


class ChambreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chambre
        fields = [
            "id",
            "numero",
            "type",
            "capacite",
            "tarif",
            "etat",
            "actif",
            "image",
            "climatisation",
            "wifi",
            "minibar",
            "balcon",
            "description",
        ]
        read_only_fields = ["etat", "actif"]


class EtatSerializer(serializers.Serializer):
    etat = serializers.ChoiceField(choices=Chambre.Etat.choices)


class IndisponibiliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indisponibilite
        fields = ["id", "chambre", "date_debut", "date_fin", "motif"]

    def validate(self, data):
        chambre = data.get("chambre", getattr(self.instance, "chambre", None))
        debut = data.get("date_debut", getattr(self.instance, "date_debut", None))
        fin = data.get("date_fin", getattr(self.instance, "date_fin", None))

        if debut and fin and fin <= debut:
            raise serializers.ValidationError(
                "La date de fin doit être après la date de début."
            )

        if chambre and debut and fin:
            qs = Indisponibilite.objects.filter(
                chambre=chambre,
                date_debut__lt=fin,
                date_fin__gt=debut,
            )
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    "Cette chambre a déjà une indisponibilité qui chevauche cette période."
                )

        return data