from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


def authenticate_request(request):
    """Authenticate a JWT for a plain Django view.

    Returns (user, error). user is None when the request is anonymous.
    """
    try:
        result = JWTAuthentication().authenticate(request)
    except AuthenticationFailed as exc:
        return None, str(exc.detail)

    if result is None:
        return None, "Authentication required."

    return result[0], None
