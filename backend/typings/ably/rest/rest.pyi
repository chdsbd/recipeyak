from typing import Any, Self, overload

from ably.rest.auth import Auth
from ably.rest.channel import Channels
from ably.types.tokendetails import TokenDetails

class AblyRest:
    @overload
    def __init__(
        self,
        key: str,
    ) -> None: ...
    @overload
    def __init__(self, token: str, token_details: TokenDetails) -> None: ...
    async def __aenter__(self) -> Self: ...
    @property
    def client_id(self) -> str | None: ...
    @property
    def channels(self) -> Channels: ...
    @property
    def auth(self) -> Auth: ...
    async def __aexit__(self, *excinfo: Any) -> None: ...
    async def close(self) -> None: ...
