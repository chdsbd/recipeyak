from __future__ import annotations

import collections
import logging
from typing import Any, Iterable, Optional

import advocate
import sentry_sdk
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.cumin.quantity import parse_ingredient
from core.models import (
    Ingredient,
    Note,
    Reaction,
    ScheduledRecipe,
    Section,
    Step,
    TimelineEvent,
    Upload,
    user_and_team_recipes,
)
from core.models.recipe import Recipe
from core.models.team import Team
from core.models.user import get_avatar_url
from core.recipes.scraper import scrape_recipe
from core.recipes.serializers import (
    RecipeSerializer,
    serialize_attachments,
    serialize_reactions,
)
from core.request import AuthedRequest
from core.serialization import RequestParams

logger = logging.getLogger(__name__)


def group_by_recipe_id(x: Iterable[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    map = collections.defaultdict(list)
    for item in x:
        map[item["recipe_id"]].append(item)
    return map


def recipe_get_view(request: AuthedRequest) -> Response:
    with sentry_sdk.start_span(op="db", description="fetch recipes"):
        recipes = {
            x["id"]: x
            for x in user_and_team_recipes(request.user).values(
                "id",
                "name",
                "author",
                "source",
                "time",
                "servings",
                "edits",
                "modified",
                "owner_team",
                "owner_team__name",
                "owner_user",
                "created",
                "archived_at",
                "tags",
            )
        }

    with sentry_sdk.start_span(op="db", description="fetch ingredients"):
        ingredients = group_by_recipe_id(
            Ingredient.objects.filter(recipe_id__in=recipes.keys()).values(
                "id",
                "quantity",
                "name",
                "description",
                "position",
                "recipe_id",
            )
        )

    with sentry_sdk.start_span(op="db", description="fetch schedules"):
        schedule_recipe = dict()
        for schedule in (
            ScheduledRecipe.objects.filter(recipe_id__in=recipes.keys())
            .distinct("recipe_id")
            .order_by("-recipe_id", "-on")
            .values("recipe_id", "on")
        ):
            schedule_recipe[schedule["recipe_id"]] = schedule["on"]

    with sentry_sdk.start_span(op="db", description="fetch steps"):
        steps = group_by_recipe_id(
            Step.objects.filter(recipe_id__in=recipes.keys()).values(
                "id",
                "text",
                "position",
                "recipe_id",
            )
        )

    with sentry_sdk.start_span(op="db", description="fetch sections"):
        sections = group_by_recipe_id(
            Section.objects.filter(recipe_id__in=recipes.keys()).values(
                "id",
                "title",
                "position",
                "recipe_id",
            )
        )

    with sentry_sdk.start_span(op="db", description="fetch notes"):
        notes = collections.defaultdict(list)
        note_map = dict()
        for note in Note.objects.filter(recipe_id__in=recipes.keys()).values(
            "id",
            "text",
            "modified",
            "created",
            "recipe_id",
            "last_modified_by",
            "last_modified_by__email",
            "last_modified_by__name",
            "created_by",
            "created_by__email",
            "created_by__name",
        ):

            for name in ("last_modified_by", "created_by"):
                if note[name] is not None:
                    display_name = note.get(f"{name}__name") or note[f"{name}__email"]
                    email = note[f"{name}__email"]
                    note[name] = dict(
                        id=note[name],
                        email=email,
                        name=display_name,
                        avatar_url=get_avatar_url(email),
                    )
                else:
                    note.pop(name, None)
                note.pop(f"{name}__email", None)
                note.pop(f"{name}__name", None)
            note["type"] = "note"
            note["attachments"] = []
            note["reactions"] = []
            notes[note["recipe_id"]].append(note)
            note_map[note["id"]] = note

    with sentry_sdk.start_span(op="db", description="uploads"):
        for upload in Upload.objects.filter(note__recipe_id__in=recipes.keys()):
            note_map[upload.note_id]["attachments"].append(
                list(serialize_attachments([upload]))[0].dict()
            )
    with sentry_sdk.start_span(op="db", description="reactions"):
        for reaction in Reaction.objects.filter(note__recipe_id__in=recipes.keys()):
            note_map[reaction.note_id]["reactions"].append(
                list(serialize_reactions([reaction]))[0].dict()
            )

    with sentry_sdk.start_span(op="db", description="timeline"):
        timeline_events = collections.defaultdict(list)

        for event in TimelineEvent.objects.filter(recipe_id__in=recipes.keys()).values(
            "id",
            "action",
            "created",
            "created_by",
            "created_by__email",
            "recipe_id",
        ):
            if event["created_by"] is not None:
                email = event["created_by__email"]
                event["created_by"] = dict(
                    id=event["created_by"],
                    email=email,
                    avatar_url=get_avatar_url(email),
                )
            event.pop("created_by__email", None)
            event["type"] = "recipe"
            timeline_events[event["recipe_id"]].append(event)

    with sentry_sdk.start_span(op="serialize", description="recipe stuff"):
        for recipe_id, recipe in recipes.items():
            if recipe["owner_team"]:
                recipe["owner"] = dict(
                    type="team",
                    id=recipe["owner_team"],
                    name=recipe["owner_team__name"],
                )
            else:
                recipe["owner"] = dict(type="user", id=recipe["owner_team"])

            recipe.pop("owner_user", None)
            recipe.pop("owner_user", None)
            recipe.pop("owner_team__name", None)

            recipe["last_scheduled_at"] = schedule_recipe.get(recipe_id)

            recipe["ingredients"] = ingredients.get(recipe_id) or []
            recipe["steps"] = steps.get(recipe_id) or []
            recipe["sections"] = sections.get(recipe_id) or []
            recipe["timelineItems"] = (notes.get(recipe_id) or []) + (
                timeline_events.get(recipe_id) or []
            )

    return Response(list(recipes.values()))


class RecipePostParams(RequestParams):
    team: str
    from_url: Optional[str] = None
    name: Optional[str] = None


def recipe_post_view(request: AuthedRequest) -> Response:
    params = RecipePostParams.parse_obj(request.data)

    # validate params
    team = Team.objects.filter(id=params.team, membership__user=request.user).first()
    if team is None:
        return Response(
            # TODO(sbdchd): figure out error format
            {"error": True, "message": "Unknown Team"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if params.from_url is not None:
        try:
            scrape_result = scrape_recipe(url=params.from_url)
        except (advocate.exceptions.UnacceptableAddressException, ValidationError):
            return Response(
                {"error": True, "message": "invalid url"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipe = Recipe.objects.create(
            scrape_id=scrape_result.id,
            owner=team,
            name=scrape_result.title,
            author=scrape_result.author,
            servings=scrape_result.yields,
            time=scrape_result.total_time,
            source=scrape_result.canonical_url,
        )

        ingredients: list[Ingredient] = []
        for idx, ingredient in enumerate(scrape_result.ingredients):
            parsed_ingredient = parse_ingredient(ingredient)
            ingredients.append(
                Ingredient(
                    position=idx,
                    recipe=recipe,
                    quantity=parsed_ingredient.quantity,
                    name=parsed_ingredient.name,
                    description=parsed_ingredient.description,
                    optional=parsed_ingredient.optional,
                )
            )
        Ingredient.objects.bulk_create(ingredients)

        steps = [
            Step(text=step, position=idx, recipe=recipe)
            for idx, step in enumerate(scrape_result.instructions)
        ]
        Step.objects.bulk_create(steps)
    else:
        recipe = Recipe.objects.create(owner=team, name=params.name)

    TimelineEvent(
        action="created",
        created_by=request.user,
        recipe=recipe,
    ).save()

    return Response(
        RecipeSerializer(recipe, dangerously_allow_db=True).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def recipe_list_view(request: AuthedRequest) -> Response:
    if request.method == "GET":
        return recipe_get_view(request)
    elif request.method == "POST":
        return recipe_post_view(request)
    raise MethodNotAllowed(request.method or "")
