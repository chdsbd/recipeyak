import pytest
from rest_framework.test import APIClient

from recipeyak.models import Recipe, User
from recipeyak.models.team import Team

pytestmark = pytest.mark.django_db


def test_accessing_recipes(
    client: APIClient, user: User, recipe: Recipe, user2: User, team: Team
) -> None:
    """
    ensure a user can only access their own recipes
    """
    client.force_authenticate(user)

    recipe.team = team
    recipe.save()

    res = client.get(f"/api/v1/recipes/{recipe.id}/")
    assert res.status_code == 200

    client.force_authenticate(user2)

    res = client.get(f"/api/v1/recipes/{recipe.id}/")
    assert res.status_code == 404

    client.force_authenticate(None)

    res = client.get(f"/api/v1/recipes/{recipe.id}/")
    assert res.status_code == 403