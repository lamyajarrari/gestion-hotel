from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("housekeeping", "0003_demandes"),
    ]

    operations = [
        migrations.AddField(
            model_name="demandenettoyage",
            name="chambre_numero",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="servicemenage",
            name="chambre_numero",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
    ]