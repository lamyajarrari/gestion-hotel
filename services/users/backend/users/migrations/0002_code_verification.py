from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="utilisateur",
            name="code_expiration",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="utilisateur",
            name="code_verification",
            field=models.CharField(blank=True, default="", max_length=6),
        ),
    ]