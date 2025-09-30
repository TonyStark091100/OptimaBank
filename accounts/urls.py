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
    path("redemptions/<str:redemption_id>/serve/", views.serve_voucher_pdf, name="serve_voucher_pdf"),
    
    # Notification endpoints
    path("notifications/", views.notification_list, name="notification_list"),
    path("notifications/mark-read/", views.mark_notifications_read, name="mark_notifications_read"),
    
    # Tiered Rewards System endpoints
    path("tiers/", views.get_all_tiers, name="get_all_tiers"),
    path("tiers/user/", views.get_user_tier_info, name="get_user_tier_info"),
    path("tiers/status/", views.get_tier_status, name="get_tier_status"),
    path("tiers/<int:tier_id>/benefits/", views.get_tier_benefits, name="get_tier_benefits"),
    path("tiers/activities/", views.get_user_activities, name="get_user_activities"),
    path("tiers/activities/add/", views.add_tier_activity, name="add_tier_activity"),
    path("tiers/login-bonus/", views.simulate_login_activity, name="simulate_login_activity"),
    
    # Real-time Analytics endpoints
    path("analytics/realtime/", views.get_realtime_analytics, name="get_realtime_analytics"),
    path("analytics/live-users/", views.get_live_user_count, name="get_live_user_count"),
    
    # Mini-Games endpoints
    path("games/", views.get_mini_games, name="get_mini_games"),
    path("games/submit-score/", views.submit_game_score, name="submit_game_score"),
    path("games/history/", views.get_user_game_history, name="get_user_game_history"),
    
    # Leaderboard endpoints
    path("leaderboard/", views.get_leaderboard, name="get_leaderboard"),
    path("leaderboard/privacy/", views.update_leaderboard_privacy, name="update_leaderboard_privacy"),
    path("leaderboard/stats/", views.get_user_leaderboard_stats, name="get_user_leaderboard_stats"),
]
