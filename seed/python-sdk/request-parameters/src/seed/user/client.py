# This file was auto-generated by Fern from our API Definition.

import datetime as dt
import typing
import uuid

from ..core.client_wrapper import AsyncClientWrapper, SyncClientWrapper
from ..core.request_options import RequestOptions
from .raw_client import AsyncRawUserClient, RawUserClient
from .types.nested_user import NestedUser
from .types.user import User

# this is used as the default value for optional parameters
OMIT = typing.cast(typing.Any, ...)


class UserClient:
    def __init__(self, *, client_wrapper: SyncClientWrapper):
        self._raw_client = RawUserClient(client_wrapper=client_wrapper)

    @property
    def with_raw_response(self) -> RawUserClient:
        """
        Retrieves a raw implementation of this client that returns raw responses.

        Returns
        -------
        RawUserClient
        """
        return self._raw_client

    def create_username(
        self, *, username: str, password: str, name: str, request_options: typing.Optional[RequestOptions] = None
    ) -> None:
        """
        Parameters
        ----------
        username : str

        password : str

        name : str

        request_options : typing.Optional[RequestOptions]
            Request-specific configuration.

        Returns
        -------
        None

        Examples
        --------
        from seed import SeedRequestParameters

        client = SeedRequestParameters(
            base_url="https://yourhost.com/path/to/api",
        )
        client.user.create_username(
            username="username",
            password="password",
            name="test",
        )
        """
        _response = self._raw_client.create_username(
            username=username, password=password, name=name, request_options=request_options
        )
        return _response.data

    def get_username(
        self,
        *,
        limit: int,
        id: uuid.UUID,
        date: dt.date,
        deadline: dt.datetime,
        bytes: str,
        user: User,
        user_list: typing.Sequence[User],
        key_value: typing.Dict[str, str],
        nested_user: NestedUser,
        exclude_user: typing.Union[User, typing.Sequence[User]],
        filter: typing.Union[str, typing.Sequence[str]],
        long_param: int,
        big_int_param: str,
        optional_deadline: typing.Optional[dt.datetime] = None,
        optional_string: typing.Optional[str] = None,
        optional_user: typing.Optional[User] = None,
        request_options: typing.Optional[RequestOptions] = None,
    ) -> User:
        """
        Parameters
        ----------
        limit : int

        id : uuid.UUID

        date : dt.date

        deadline : dt.datetime

        bytes : str

        user : User

        user_list : typing.Sequence[User]

        key_value : typing.Dict[str, str]

        nested_user : NestedUser

        exclude_user : typing.Union[User, typing.Sequence[User]]

        filter : typing.Union[str, typing.Sequence[str]]

        long_param : int

        big_int_param : str

        optional_deadline : typing.Optional[dt.datetime]

        optional_string : typing.Optional[str]

        optional_user : typing.Optional[User]

        request_options : typing.Optional[RequestOptions]
            Request-specific configuration.

        Returns
        -------
        User

        Examples
        --------
        import datetime
        import uuid

        from seed import SeedRequestParameters
        from seed.user import NestedUser, User

        client = SeedRequestParameters(
            base_url="https://yourhost.com/path/to/api",
        )
        client.user.get_username(
            limit=1,
            id=uuid.UUID(
                "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
            ),
            date=datetime.date.fromisoformat(
                "2023-01-15",
            ),
            deadline=datetime.datetime.fromisoformat(
                "2024-01-15 09:30:00+00:00",
            ),
            bytes="SGVsbG8gd29ybGQh",
            user=User(
                name="name",
                tags=["tags", "tags"],
            ),
            user_list=[
                User(
                    name="name",
                    tags=["tags", "tags"],
                ),
                User(
                    name="name",
                    tags=["tags", "tags"],
                ),
            ],
            optional_deadline=datetime.datetime.fromisoformat(
                "2024-01-15 09:30:00+00:00",
            ),
            key_value={"keyValue": "keyValue"},
            optional_string="optionalString",
            nested_user=NestedUser(
                name="name",
                user=User(
                    name="name",
                    tags=["tags", "tags"],
                ),
            ),
            optional_user=User(
                name="name",
                tags=["tags", "tags"],
            ),
            exclude_user=User(
                name="name",
                tags=["tags", "tags"],
            ),
            filter="filter",
            long_param=1000000,
            big_int_param=1000000,
        )
        """
        _response = self._raw_client.get_username(
            limit=limit,
            id=id,
            date=date,
            deadline=deadline,
            bytes=bytes,
            user=user,
            user_list=user_list,
            key_value=key_value,
            nested_user=nested_user,
            exclude_user=exclude_user,
            filter=filter,
            long_param=long_param,
            big_int_param=big_int_param,
            optional_deadline=optional_deadline,
            optional_string=optional_string,
            optional_user=optional_user,
            request_options=request_options,
        )
        return _response.data


class AsyncUserClient:
    def __init__(self, *, client_wrapper: AsyncClientWrapper):
        self._raw_client = AsyncRawUserClient(client_wrapper=client_wrapper)

    @property
    def with_raw_response(self) -> AsyncRawUserClient:
        """
        Retrieves a raw implementation of this client that returns raw responses.

        Returns
        -------
        AsyncRawUserClient
        """
        return self._raw_client

    async def create_username(
        self, *, username: str, password: str, name: str, request_options: typing.Optional[RequestOptions] = None
    ) -> None:
        """
        Parameters
        ----------
        username : str

        password : str

        name : str

        request_options : typing.Optional[RequestOptions]
            Request-specific configuration.

        Returns
        -------
        None

        Examples
        --------
        import asyncio

        from seed import AsyncSeedRequestParameters

        client = AsyncSeedRequestParameters(
            base_url="https://yourhost.com/path/to/api",
        )


        async def main() -> None:
            await client.user.create_username(
                username="username",
                password="password",
                name="test",
            )


        asyncio.run(main())
        """
        _response = await self._raw_client.create_username(
            username=username, password=password, name=name, request_options=request_options
        )
        return _response.data

    async def get_username(
        self,
        *,
        limit: int,
        id: uuid.UUID,
        date: dt.date,
        deadline: dt.datetime,
        bytes: str,
        user: User,
        user_list: typing.Sequence[User],
        key_value: typing.Dict[str, str],
        nested_user: NestedUser,
        exclude_user: typing.Union[User, typing.Sequence[User]],
        filter: typing.Union[str, typing.Sequence[str]],
        long_param: int,
        big_int_param: str,
        optional_deadline: typing.Optional[dt.datetime] = None,
        optional_string: typing.Optional[str] = None,
        optional_user: typing.Optional[User] = None,
        request_options: typing.Optional[RequestOptions] = None,
    ) -> User:
        """
        Parameters
        ----------
        limit : int

        id : uuid.UUID

        date : dt.date

        deadline : dt.datetime

        bytes : str

        user : User

        user_list : typing.Sequence[User]

        key_value : typing.Dict[str, str]

        nested_user : NestedUser

        exclude_user : typing.Union[User, typing.Sequence[User]]

        filter : typing.Union[str, typing.Sequence[str]]

        long_param : int

        big_int_param : str

        optional_deadline : typing.Optional[dt.datetime]

        optional_string : typing.Optional[str]

        optional_user : typing.Optional[User]

        request_options : typing.Optional[RequestOptions]
            Request-specific configuration.

        Returns
        -------
        User

        Examples
        --------
        import asyncio
        import datetime
        import uuid

        from seed import AsyncSeedRequestParameters
        from seed.user import NestedUser, User

        client = AsyncSeedRequestParameters(
            base_url="https://yourhost.com/path/to/api",
        )


        async def main() -> None:
            await client.user.get_username(
                limit=1,
                id=uuid.UUID(
                    "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
                ),
                date=datetime.date.fromisoformat(
                    "2023-01-15",
                ),
                deadline=datetime.datetime.fromisoformat(
                    "2024-01-15 09:30:00+00:00",
                ),
                bytes="SGVsbG8gd29ybGQh",
                user=User(
                    name="name",
                    tags=["tags", "tags"],
                ),
                user_list=[
                    User(
                        name="name",
                        tags=["tags", "tags"],
                    ),
                    User(
                        name="name",
                        tags=["tags", "tags"],
                    ),
                ],
                optional_deadline=datetime.datetime.fromisoformat(
                    "2024-01-15 09:30:00+00:00",
                ),
                key_value={"keyValue": "keyValue"},
                optional_string="optionalString",
                nested_user=NestedUser(
                    name="name",
                    user=User(
                        name="name",
                        tags=["tags", "tags"],
                    ),
                ),
                optional_user=User(
                    name="name",
                    tags=["tags", "tags"],
                ),
                exclude_user=User(
                    name="name",
                    tags=["tags", "tags"],
                ),
                filter="filter",
                long_param=1000000,
                big_int_param=1000000,
            )


        asyncio.run(main())
        """
        _response = await self._raw_client.get_username(
            limit=limit,
            id=id,
            date=date,
            deadline=deadline,
            bytes=bytes,
            user=user,
            user_list=user_list,
            key_value=key_value,
            nested_user=nested_user,
            exclude_user=exclude_user,
            filter=filter,
            long_param=long_param,
            big_int_param=big_int_param,
            optional_deadline=optional_deadline,
            optional_string=optional_string,
            optional_user=optional_user,
            request_options=request_options,
        )
        return _response.data
