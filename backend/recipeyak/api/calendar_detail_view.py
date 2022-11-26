from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional

import pydantic
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from recipeyak.api.base.permissions import IsTeamMember
from recipeyak.api.base.request import AuthedRequest
from recipeyak.api.base.serialization import RequestParams
from recipeyak.api.calendar_list_view import get_scheduled_recipes

logger = logging.getLogger(__name__)


class ScheduledRecipeUpdateParams(RequestParams):
    on: Optional[date]
    count: Optional[int]


class CreatedBySerializer(pydantic.BaseModel):
    id: int
    name: str
    avatar_url: str


class RecipeMetadataSerializer(pydantic.BaseModel):
    id: int
    name: str


class ScheduleRecipeSerializer(pydantic.BaseModel):
    id: int
    count: int
    created: datetime
    createdBy: Optional[CreatedBySerializer]
    team: Optional[str]
    user: Optional[str]
    recipe: RecipeMetadataSerializer
    on: date


def calendar_detail_patch_view(
    request: AuthedRequest, team_pk: str, scheduled_recipe_id: str
) -> Response:
    params = ScheduledRecipeUpdateParams.parse_obj(request.data)
    scheduled_recipe = get_scheduled_recipes(request, team_pk).get(
        id=scheduled_recipe_id
    )
    if params.on is not None:
        scheduled_recipe.on = params.on
    if params.count is not None:
        scheduled_recipe.count = params.count
    scheduled_recipe.save()

    recipe = RecipeMetadataSerializer(
        id=scheduled_recipe.recipe_id, name=scheduled_recipe.recipe.name
    )

    return Response(
        ScheduleRecipeSerializer(
            id=scheduled_recipe.id,
            count=scheduled_recipe.count,
            created=scheduled_recipe.created,
            recipe=recipe,
            on=scheduled_recipe.on,
        )
    )


def calendar_detail_delete_view(
    request: AuthedRequest, team_pk: str, scheduled_recipe_id: str
) -> Response:
    get_scheduled_recipes(request, team_pk).filter(id=scheduled_recipe_id).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated, IsTeamMember])
def calendar_detail_view(request: AuthedRequest, team_pk: str, pk: str) -> Response:
    if request.method == "PATCH":
        return calendar_detail_patch_view(request, team_pk, pk)
    elif request.method == "DELETE":
        return calendar_detail_delete_view(request, team_pk, pk)
    raise MethodNotAllowed(request.method or "")