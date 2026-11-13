from rest_framework.pagination import PageNumberPagination


class PaginationChambres(PageNumberPagination):
    page_size = 8