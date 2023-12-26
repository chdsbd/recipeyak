from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response

from recipeyak.api.base.permissions import has_recipe_access
from recipeyak.api.base.request import AuthedRequest
from recipeyak.api.base.serialization import RequestParams
from recipeyak.api.serializers.recipe import serialize_section
from recipeyak.models import ChangeType, RecipeChange, Section


class SectionUpdateParams(RequestParams):
    position: str | None = None
    title: str | None = None


def section_update_view(request: AuthedRequest, section_pk: int) -> Response:
    section = get_object_or_404(Section, pk=section_pk)
    recipe = section.recipe
    if not has_recipe_access(recipe=section.recipe, user=request.user):
        return Response(status=status.HTTP_403_FORBIDDEN)

    params = SectionUpdateParams.parse_obj(request.data)
    if params.title is not None:
        section.title = params.title
    if params.position is not None:
        section.position = params.position
    RecipeChange.objects.create(
        recipe=recipe,
        actor=request.user,
        before=section.title,
        after=params.title or "",
        change_type=ChangeType.SECTION_UPDATE,
    )
    section.save()

    return Response(serialize_section(section))
