from __future__ import annotations

from django.shortcuts import get_object_or_404

from recipeyak.api.base.decorators import endpoint
from recipeyak.api.base.request import AuthedHttpRequest
from recipeyak.api.base.response import JsonResponse
from recipeyak.api.serializers.recipe import ingredient_to_text
from recipeyak.models import ChangeType, RecipeChange, filter_ingredients, get_team
from recipeyak.realtime import publish_recipe


@endpoint()
def ingredient_delete_view(
    request: AuthedHttpRequest[None], ingredient_id: int
) -> JsonResponse[None]:
    team = get_team(request.user)
    ingredient = get_object_or_404(filter_ingredients(team=team), pk=ingredient_id)
    RecipeChange.objects.create(
        recipe=ingredient.recipe,
        actor=request.user,
        before=ingredient_to_text(ingredient),
        after="",
        change_type=ChangeType.INGREDIENT_DELETE,
    )
    filter_ingredients(team=team).filter(pk=ingredient_id).delete()
    publish_recipe(recipe_id=ingredient.recipe_id, team_id=team.id)
    return JsonResponse(None, status=204)
