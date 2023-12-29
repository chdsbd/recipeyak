from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from recipeyak import ordering
from recipeyak.api.base.request import AuthedRequest
from recipeyak.api.base.serialization import RequestParams, StrTrimmed
from recipeyak.api.serializers.recipe import ingredient_to_text, serialize_ingredient
from recipeyak.models import (
    ChangeType,
    Ingredient,
    RecipeChange,
    filter_recipes,
    get_team,
)
from recipeyak.models.section import Section


class IngredientCreateParams(RequestParams):
    quantity: StrTrimmed
    name: StrTrimmed
    description: StrTrimmed
    position: str | None = None
    optional: bool | None = None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ingredient_create_view(request: AuthedRequest, recipe_id: int) -> Response:
    params = IngredientCreateParams.parse_obj(request.data)
    team = get_team(request.user)
    recipe = get_object_or_404(filter_recipes(team=team), pk=recipe_id)

    ingredient = Ingredient(
        quantity=params.quantity,
        name=params.name,
        description=params.description,
        recipe=recipe,
    )
    if params.optional is not None:
        ingredient.optional = params.optional
    if params.position is not None:
        ingredient.position = params.position
    else:
        last_section = Section.objects.filter(recipe=recipe).last()
        last_ingredient = recipe.ingredient_set.last()
        last_item = last_section or last_ingredient
        if last_item is not None:
            ingredient.position = ordering.position_after(last_item.position)
        else:
            ingredient.position = ordering.FIRST_POSITION
    ingredient.save()

    RecipeChange.objects.create(
        recipe=recipe,
        actor=request.user,
        before="",
        after=ingredient_to_text(ingredient),
        change_type=ChangeType.INGREDIENT_CREATE,
    )
    return Response(serialize_ingredient(ingredient), status=201)