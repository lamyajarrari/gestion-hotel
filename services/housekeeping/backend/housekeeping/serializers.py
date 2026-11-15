from rest_framework import serializers

from .models import DemandeNettoyage, Priorite, ServiceMenage, TypeService


class ServiceMenageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceMenage
        fields = [
            "id", "chambre_id", "agent_id", "type", "statut", "description", "priorite",
            "date_prevue", "date_creation", "date_debut", "date_fin", "assigne_par", "demande",
        ]
        read_only_fields = fields


class AssignerSerializer(serializers.Serializer):
    chambre_id = serializers.CharField(max_length=64)
    agent_id = serializers.CharField(max_length=64)
    type = serializers.ChoiceField(choices=TypeService.choices)
    date_prevue = serializers.DateField()
    description = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    priorite = serializers.ChoiceField(choices=Priorite.choices, default=Priorite.NORMALE)


class ModifierSerializer(serializers.Serializer):
    """Seuls la description et la priorité sont modifiables ; le statut suit le cycle démarrer/terminer."""

    description = serializers.CharField(max_length=500, required=False, allow_blank=True)
    priorite = serializers.ChoiceField(choices=Priorite.choices, required=False)
    date_prevue = serializers.DateField(required=False)

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Indiquez le champ à modifier (description, priorité, date prévue).")
        return data


class DemandeSerializer(serializers.ModelSerializer):
    service = serializers.SerializerMethodField()

    class Meta:
        model = DemandeNettoyage
        fields = ["id", "chambre_id", "client_id", "description", "priorite", "statut",
                  "date_demande", "service"]
        read_only_fields = fields

    def get_service(self, demande):
        """Dernier service de ménage lié à la demande (suivi, spécification H008)."""
        s = demande.services.order_by("-date_creation").first()
        if not s:
            return None
        return {"id": str(s.id), "agent_id": s.agent_id, "statut": s.statut,
                "date_prevue": s.date_prevue, "date_debut": s.date_debut, "date_fin": s.date_fin}


class CreerDemandeSerializer(serializers.Serializer):
    chambre_id = serializers.CharField(max_length=64)
    description = serializers.CharField(max_length=500)
    priorite = serializers.ChoiceField(choices=Priorite.choices, default=Priorite.NORMALE)


class TraiterDemandeSerializer(serializers.Serializer):
    agent_id = serializers.CharField(max_length=64)
    date_prevue = serializers.DateField()
