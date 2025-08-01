# This file was auto-generated by Fern from our API Definition.

import glob
import importlib
import os
import types
import typing

import fastapi
import starlette.exceptions
from .core.abstract_fern_service import AbstractFernService
from .core.exceptions import default_exception_handler, fern_http_exception_handler, http_exception_handler
from .core.exceptions.fern_http_exception import FernHTTPException
from .resources.endpoints.resources.container.service.service import AbstractEndpointsContainerService
from .resources.endpoints.resources.content_type.service.service import AbstractEndpointsContentTypeService
from .resources.endpoints.resources.enum.service.service import AbstractEndpointsEnumService
from .resources.endpoints.resources.http_methods.service.service import AbstractEndpointsHttpMethodsService
from .resources.endpoints.resources.object.service.service import AbstractEndpointsObjectService
from .resources.endpoints.resources.params.service.service import AbstractEndpointsParamsService
from .resources.endpoints.resources.primitive.service.service import AbstractEndpointsPrimitiveService
from .resources.endpoints.resources.put.service.service import AbstractEndpointsPutService
from .resources.endpoints.resources.union.service.service import AbstractEndpointsUnionService
from .resources.endpoints.resources.urls.service.service import AbstractEndpointsUrlsService
from .resources.inlined_requests.service.service import AbstractInlinedRequestsService
from .resources.no_auth.service.service import AbstractNoAuthService
from .resources.no_req_body.service.service import AbstractNoReqBodyService
from .resources.req_with_headers.service.service import AbstractReqWithHeadersService
from fastapi import params


def register(_app: fastapi.FastAPI, *, endpoints_container: AbstractEndpointsContainerService, endpoints_content_type: AbstractEndpointsContentTypeService, endpoints_enum: AbstractEndpointsEnumService, endpoints_http_methods: AbstractEndpointsHttpMethodsService, endpoints_object: AbstractEndpointsObjectService, endpoints_params: AbstractEndpointsParamsService, endpoints_primitive: AbstractEndpointsPrimitiveService, endpoints_put: AbstractEndpointsPutService, endpoints_union: AbstractEndpointsUnionService, endpoints_urls: AbstractEndpointsUrlsService, inlined_requests: AbstractInlinedRequestsService, no_auth: AbstractNoAuthService, no_req_body: AbstractNoReqBodyService, req_with_headers: AbstractReqWithHeadersService, dependencies: typing.Optional[typing.Sequence[params.Depends]] = None) -> None:
    _app.include_router(__register_service(endpoints_container), dependencies=dependencies)
    _app.include_router(__register_service(endpoints_content_type), dependencies=dependencies)
    _app.include_router(__register_service(endpoints_enum), dependencies=dependencies)
    _app.include_router(__register_service(endpoints_http_methods), dependencies=dependencies)
    _app.include_router(__register_service(endpoints_object), dependencies=dependencies)
    _app.include_router(__register_service(endpoints_params), dependencies=dependencies)
    _app.include_router(__register_service(endpoints_primitive), dependencies=dependencies)
    _app.include_router(__register_service(endpoints_put), dependencies=dependencies)
    _app.include_router(__register_service(endpoints_union), dependencies=dependencies)
    _app.include_router(__register_service(endpoints_urls), dependencies=dependencies)
    _app.include_router(__register_service(inlined_requests), dependencies=dependencies)
    _app.include_router(__register_service(no_auth), dependencies=dependencies)
    _app.include_router(__register_service(no_req_body), dependencies=dependencies)
    _app.include_router(__register_service(req_with_headers), dependencies=dependencies)
    
    _app.add_exception_handler(FernHTTPException, fern_http_exception_handler)  # type: ignore
    _app.add_exception_handler(starlette.exceptions.HTTPException, http_exception_handler)  # type: ignore
    _app.add_exception_handler(Exception, default_exception_handler)  # type: ignore
def __register_service(service: AbstractFernService) -> fastapi.APIRouter:
    router = fastapi.APIRouter()
    type(service)._init_fern(router)
    return router
def register_validators(module: types.ModuleType) -> None:
    validators_directory: str = os.path.dirname(module.__file__)  # type: ignore
    for path in glob.glob(os.path.join(validators_directory, "**/*.py"), recursive=True):
        if os.path.isfile(path):
            relative_path = os.path.relpath(path, start=validators_directory)
            module_path = ".".join([module.__name__] + relative_path[:-3].split("/"))
            importlib.import_module(module_path)
