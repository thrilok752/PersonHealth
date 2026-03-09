from django.urls import path
from .views import *

urlpatterns = [
    # 🔐 Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

   # Post-login (user is authenticated)
    path('auth/password/change/send-otp/',   password_change_send_otp),
    path('auth/password/change/verify-otp/', password_change_verify_otp),
    path('auth/password/change/confirm/',    password_change_confirm),

    # Pre-login (forgot password)
    path('auth/password/forgot/send/',   password_forgot_send),
    path('auth/password/forgot/verify/', password_forgot_verify),
    path('auth/password/forgot/reset/',  password_forgot_reset),

    # 👤 User Profile
    path('profile/', UserProfileView.as_view(), name='profile'),

    # 💊 Medical Features
    path('medicine/', MedicineSearchView.as_view(), name='medicine_search'),
    path('remedies/', NaturalRemediesView.as_view(), name='natural_remedies'),
    path('appointments/', UserAppointmentsView.as_view(), name='user_appointments'),
    path('appointments/<int:pk>/cancel/', CancelAppointmentView.as_view(), name='cancel_appointment'),
    path('search-doctors-by-symptom/', search_doctors_by_symptom,name='search doc'),
    path('book-appointment/', BookAppointmentView.as_view()),
    path('available-slots/', AvailableSlotsView.as_view(), name='available_slots'),
     path('process-appointment/<int:appointment_id>/',process_appointment, name='process_appointment'),
    # path('nearby-doctors/', NearbyDoctorsAPIView.as_view(), name='nearby_doctors'),


    # 📊 Health Tracking & Dashboard
    path("predict-health-tip/", PredictHealthTipView.as_view(), name="predict_health_tip"),
    path('mood/', MoodTrackerView.as_view(), name='mood_tracker'),
    path('nutrition/log/', LogNutritionAPIView.as_view(), name='log-nutrition'),
    path('nutrition/foods/', FoodListAPIView.as_view(), name='food-list'),
    path('nutrition/today-summary/', DailyNutritionSummaryAPIView.as_view(), name='nutrition-summary'),
    path("water-intake/summary/", TodayWaterIntakeTotalView.as_view()),
    path('water-intake/', WaterIntakeView.as_view(), name='water_intake'),
    path('water-intake/<int:pk>/', WaterIntakeDeleteView.as_view(), name='delete-water-intake'),
    path('add-metric/', AddHealthMetricView.as_view(), name='add-metric'),
    path('metrics/trend/', TrendDataView.as_view(), name='trend-data'),
    path('wellness-quote/', WellnessQuoteView.as_view(), name='wellness_quote'),
    path('chatbot/',ask_model, name='chatbot'),
]