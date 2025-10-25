from django.utils.deprecation import MiddlewareMixin

class SecurityHeadersMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
        csp = (
            "default-src 'self'; "
            "base-uri 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://accounts.gstatic.com https://apis.google.com; "
            "frame-src 'self' https://accounts.google.com https://accounts.gstatic.com; "
            "connect-src 'self' https://accounts.google.com https://accounts.gstatic.com https://apis.google.com; "
            "img-src 'self' data: https://*.googleusercontent.com https://ssl.gstatic.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "frame-ancestors 'self'"
        )
        response.headers["Content-Security-Policy"] = csp
        return response
