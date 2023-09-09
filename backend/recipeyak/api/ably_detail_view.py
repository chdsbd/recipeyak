from __future__ import annotations

import asyncio

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from recipeyak.api.base.request import AuthedRequest
from recipeyak.api.team_detail_view import get_teams
from recipeyak.live_updates import AblyRest


async def get_token(user_id: str, team_ids: list[int]) -> dict[object, object]:
    async with AblyRest as ably:
        res = await ably.auth.create_token_request(
            {
                "clientId": user_id,
                "capability": {
                    f"scheduled_recipe:{team_id}": ["subscribe"] for team_id in team_ids
                },
            }
        )

        return res.to_dict()  # type: ignore [no-any-return]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ably_detail_view(request: AuthedRequest) -> Response:
    # NOTE: this isn't really scalable if the user has a lot of teams.
    team_ids = list(get_teams(user=request.user).values_list("id", flat=True))
    return Response(
        asyncio.run(get_token(user_id=str(request.user.id), team_ids=team_ids)),
        status=status.HTTP_200_OK,
    )
