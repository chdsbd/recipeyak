from typing import Any

class TokenRequest:
    def __init__(
        self,
        key_name: Any | None = None,
        client_id: Any | None = None,
        nonce: Any | None = None,
        mac: Any | None = None,
        capability: Any | None = None,
        ttl: Any | None = None,
        timestamp: Any | None = None,
    ) -> None: ...
    def sign_request(self, key_secret: str) -> None: ...
    def to_dict(self) -> dict[str, Any]: ...
    @staticmethod
    def from_json(data: str | dict[str, Any]) -> TokenRequest: ...
    @property
    def key_name(self) -> Any: ...
    @property
    def client_id(self) -> Any: ...
    @property
    def nonce(self) -> Any: ...
    @property
    def mac(self) -> Any: ...
    @mac.setter
    def mac(self, mac: Any) -> None: ...
    @property
    def capability(self) -> Any: ...
    @property
    def ttl(self) -> Any: ...
    @property
    def timestamp(self) -> Any: ...
