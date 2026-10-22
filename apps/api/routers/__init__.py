from routers.datasets import router as datasets_router
from routers.analysis import router as analysis_router
from routers.outputs import router as outputs_router
from routers.transformations import router as transformations_router
from routers.cases import router as cases_router
from routers.reports import router as reports_router

__all__ = [
    "datasets_router",
    "analysis_router",
    "outputs_router",
    "transformations_router",
    "cases_router",
    "reports_router",
]

