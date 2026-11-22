from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("housekeeping", "0004_chambre_numero"),
    ]

    operations = [
        migrations.AddField(
            model_name="servicemenage",
            name="agent_nom",
            field=models.CharField(blank=True, default="", max_length=201),
        ),
    ]