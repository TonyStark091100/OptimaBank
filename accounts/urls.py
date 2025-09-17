"""URL configuration for the accounts app."""

from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="accounts_home"),
    path("vouchers-display/", views.voucher_display, name="voucher_display"),
    path("login/", views.login, name="login"),
    
    # Voucher endpoints
    path("vouchers/", views.voucher_list, name="voucher_list"),
    path("vouchers/<int:voucher_id>/", views.voucher_detail, name="voucher_detail"),
    path("categories/", views.category_list, name="category_list"),
    
    # User profile
    path("profile/", views.user_profile, name="user_profile"),
    
    # Cart endpoints
    path("cart/", views.cart_detail, name="cart_detail"),
    path("cart/add/", views.add_to_cart, name="add_to_cart"),
    path("cart/items/<int:item_id>/", views.update_cart_item, name="update_cart_item"),
    path("cart/items/<int:item_id>/remove/", views.remove_from_cart, name="remove_from_cart"),
    
    # Redemption endpoints
    path("redeem/", views.redeem_voucher, name="redeem_voucher"),
    path("checkout/", views.checkout_cart, name="checkout_cart"),
    path("redemptions/<str:redemption_id>/pdf/", views.download_voucher_pdf, name="download_voucher_pdf"),
    
    # Notification endpoints
    path("notifications/", views.notification_list, name="notification_list"),
    path("notifications/mark-read/", views.mark_notifications_read, name="mark_notifications_read"),
]
