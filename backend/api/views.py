import datetime
import requests
import random
import csv
import os
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .utils import map_symptom_to_specialization_and_severity,assign_photo_by_gender,predict_specialist,predict_health_tip
from .chatbot import generate_answer
from django.utils import timezone as tmz
from pytz import timezone
from django.utils.timezone import now,timedelta
from django.utils.timezone import get_current_timezone
from django.core.exceptions import ObjectDoesNotExist
from django.utils.crypto import get_random_string
from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from datetime import timedelta
from rest_framework.views import APIView
from django.db.models.functions import TruncDate
from django.db.models import Avg, Max,Sum
from rest_framework.decorators import api_view,permission_classes,authentication_classes
from rest_framework.response import Response
from rest_framework import status, generics,permissions,viewsets
from rest_framework.permissions import IsAuthenticated ,AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
from .models import *
from .serializers import *
from .moodfile.mood_tips import get_mood_tip
from api.rag_helper import query_rag,query_rag_profile,_strip_profile_numbers

# 🔍 Flexible input mapping


# ----------------- 🔐 Auth Views ------------------

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            update_last_login(None, user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        try:
            RefreshToken(refresh_token).blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

# ----------------- 💊 Medicine & Remedies ------------------

class MedicineSearchView(APIView):
    def get(self, request):
        search_term = request.GET.get("search", "")
        medicines = Medicine.objects.filter(name__istartswith=search_term)[:10]
        serializer = MedicineSerializer(medicines, many=True)
        return Response(serializer.data)

class NaturalRemediesView(APIView):
    def get(self, request):
        search_term = request.GET.get("search", "")
        remedies = NaturalRemedy.objects.filter(issue__istartswith=search_term)[:10]
        serializer = NaturalRemedySerializer(remedies, many=True)
        return Response(serializer.data)

# ----------------- 📅 Appointments ------------------
# 🧠 Book Appointment (POST)
# views.py
class BookAppointmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        clinic_name = request.data.get('clinic_name')
        doctor_name = request.data.get('doctor_name')
        date_str = request.data.get('date')
        locadd = request.data.get('clinic_address')
        time_str = request.data.get('time')
        spec = request.data.get('specialization')

        if not all([doctor_name, date_str, time_str]):
            return Response({"error": "Missing required fields."}, status=400)

        try:
            appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            appointment_time = datetime.strptime(time_str, "%H:%M").time()
        except ValueError:
            return Response({"error": "Invalid date or time format."}, status=400)

        if Appointments.objects.filter(
            user=request.user,
            doctor_name=doctor_name,
            date=appointment_date,
            time=appointment_time
        ).exists():
            return Response({"error": "You already have an appointment at this time."}, status=400)

        appointment = Appointments.objects.create(
            user=request.user,
            clinic_name=clinic_name,
            doctor_name=doctor_name,
            date=appointment_date,
            time=appointment_time,
            location=locadd,
            specialization=spec,
            status='pending'
        )

        return Response({
            "message": "Appointment request submitted. Awaiting approval.",
            "approved": False,
            "appointment_id": appointment.id
        }, status=201)


# 📄 List All Appointments for Logged-in User (GET)
class UserAppointmentsView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Appointments.objects.filter(user=self.request.user).order_by('-date', '-time')

# ❌ Cancel Appointment (DELETE)
class CancelAppointmentView(generics.DestroyAPIView):
    queryset = Appointments.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Appointments.objects.filter(user=self.request.user)

import random
from datetime import datetime, time as dtime

def generate_random_slots():
    possible_slots = [dtime(hour=h, minute=0) for h in range(9, 17)]  # 9 AM to 4 PM
    return random.sample(possible_slots, k=random.randint(3, 6))  # 3–6 slots/day

def generate_fixed_slots():
    return [dtime(hour=h, minute=0) for h in range(9, 17)]  # 9 AM to 4 PM, every hour

class AvailableSlotsView(APIView):
    def get(self, request):
        doctor_name = request.query_params.get('doctor_name')
        date_str = request.query_params.get('date')

        try:
            appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except:
            return Response({"error": "Invalid date format."}, status=400)

        all_slots = generate_fixed_slots()
        booked = Appointments.objects.filter(doctor_name=doctor_name, date=appointment_date)
        booked_times = {appt.time for appt in booked}

        free_slots = [slot.strftime("%H:%M") for slot in all_slots if slot not in booked_times]
        return Response({"available_slots": free_slots})

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Appointments
import random

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_appointment(request, appointment_id):
    try:
        appointment = Appointments.objects.get(id=appointment_id)
    except Appointments.DoesNotExist:
        return Response({"error": "Appointment not found."}, status=404)

    if appointment.user != request.user:
        return Response({"error": "Unauthorized access."}, status=403)

    # ✅ Only process if still pending
    if appointment.status != 'pending':
        return Response({"message": f"Already {appointment.status}", "status": appointment.status}, status=200)

    # ✅ Simulate approval/rejection once
    new_status = random.choice(['approved', 'rejected'])
    appointment.status = new_status
    appointment.save()

    if new_status == 'approved':
        Appointments.objects.filter(
            user=appointment.user,
            doctor_name=appointment.doctor_name,
            date=appointment.date
        ).exclude(id=appointment.id).delete()

    return Response({"message": f"Appointment {new_status}", "status": new_status}, status=200)




# ----------------- 📈 Dashboard Features ------------------
class PredictHealthTipView(APIView):
    def post(self, request):
        data = request.data
        print(data)
        required_fields = [
            "Mood", "Calories", "Proteins", "Carbs", "Fats",
            "Water (ml)", "Heart Rate (bpm)", "Steps", "Sleep (min)"
        ]

        # Validate presence of all required fields
        missing = [field for field in required_fields if field not in data]
        if missing:
            return Response({"error": f"Missing fields: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = predict_health_tip(data)
            return Response({"tip": result["predicted_tip"]}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class MoodTrackerView(APIView):
    permission_classes = [IsAuthenticated]

    # Handle POST request for storing mood logs
    def post(self, request):
        serializer = MoodSerializer(data=request.data)
        if serializer.is_valid():
            mood_instance = serializer.save(user=request.user)
            tip = get_mood_tip(mood_instance.mood)  # Get AI tip for the mood

            return Response({
                "suggestion": tip
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Handle GET request for fetching recent mood logs and AI tips
    def get(self, request):
        # Get latest 2 moods for the user, ordered by 'timestamp'
        recent_moods = Mood.objects.filter(user=request.user).order_by('-timestamp')[:2]
        mood_history = [
            {"mood": mood.mood, "timestamp": mood.timestamp.strftime("%Y-%m-%d %H:%M:%S")}
            for mood in recent_moods
        ]
        
        # Get the latest mood to fetch a tip based on it
        if recent_moods:
            latest_mood = recent_moods[0].mood
            suggestion = get_mood_tip(latest_mood)
        else:
            suggestion = "No mood logs yet. Please log your mood first."

        return Response({
            "suggestion": suggestion,
            "recent_moods": mood_history
        }, status=status.HTTP_200_OK)


class WaterIntakeView(generics.ListCreateAPIView):
    serializer_class = WaterIntakeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WaterIntake.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WaterIntakeDeleteView(generics.DestroyAPIView):
    queryset = WaterIntake.objects.all()
    serializer_class = WaterIntakeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WaterIntake.objects.filter(user=self.request.user)
    

class TodayWaterIntakeTotalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = datetime.now().date()
        total = WaterIntake.objects.filter(user=request.user, timestamp__date=today).aggregate(
            total=Sum("intake_ml")
        )["total"] or 0

        return Response({"total_water_ml": total})


class WellnessQuoteView(APIView):
    def get(self, request):
        quote = WellnessQuote.objects.order_by('?').first()
        if quote:
            serializer = WellnessQuoteSerializer(quote)
            return Response(serializer.data)
        return Response({'error': 'No quotes available'}, status=404)

class LogNutritionAPIView(APIView):
    def post(self, request):
        user = request.user
        foods_data = request.data.get('foods', [])

        if not foods_data:
            return Response({"error": "No foods provided."}, status=400)

        logs = []
        for entry in foods_data:
            food_name = entry.get('food')
            portions = int(entry.get('portions', 1))

            try:
                food = FoodNutrition.objects.get(name__iexact=food_name)
            except FoodNutrition.DoesNotExist:
                return Response({"error": f"Food '{food_name}' not found."}, status=404)

            log = Nutrition.objects.create(
                user=user,
                food=food,
                portions=portions,
                calories=food.calories * portions,
                protein=food.protein * portions,
                carbs=food.carbs * portions,
                fats=food.fats * portions
            )
            logs.append(log)

        serializer = NutritionLogSerializer(logs, many=True)
        return Response(serializer.data, status=201)

class FoodListAPIView(APIView):
    def get(self, request):
        foods = FoodNutrition.objects.all()
        serializer = FoodNutritionSerializer(foods, many=True)
        return Response(serializer.data)

class DailyNutritionSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = tmz.now().date()
        logs = Nutrition.objects.filter(user=request.user, timestamp__date=today)

        # Nutrition Summary
        summary = {
            'calories': sum((log.calories or 0) for log in logs),
            'protein': sum((log.protein or 0) for log in logs),
            'carbs': sum((log.carbs or 0) for log in logs),
            'fats': sum((log.fats or 0) for log in logs),
        }

        # Just food name and portions
        food_logs = [
            {
                "food": log.food.name if hasattr(log.food, 'name') else str(log.food),
                "portions": log.portions,
            }
            for log in logs
        ]

        return Response({
            "summary": summary,
            "food_logs": food_logs
        })
# ----------------- 🔄 OTP and Password Reset ------------------

User = get_user_model()

# ---------- Config ----------
OTP_TTL = timedelta(minutes=10)
REQUIRE_ACTIVE_FOR_RESET = True         # Forgot password: only active users if True
EXPOSE_WRONG_EMAIL = False              # False keeps anti-enumeration message

# ---------- Helpers ----------
def _norm(s: str) -> str: return (s or "").strip()
def _norm_lower(s: str) -> str: return (s or "").strip().lower()

def _find_user_by_email(email: str):
    qs = User.objects.filter(email__iexact=email)
    if REQUIRE_ACTIVE_FOR_RESET:
        qs = qs.filter(is_active=True)
    return qs.first()

def _set_fp_session(session, email: str, otp: str):
    exp_ts = (tmz.now() + OTP_TTL).timestamp()
    session['fp_otp'] = otp
    session['fp_email'] = email
    session['fp_exp'] = exp_ts
    session['fp_verified'] = False
    session.modified = True
    session.cycle_key()

def _clear_fp_session(session):
    for k in ('fp_otp', 'fp_email', 'fp_exp', 'fp_verified'):
        session.pop(k, None)
    session.modified = True

def _set_cp_session(session, email: str, otp: str):
    exp_ts = (tmz.now() + OTP_TTL).timestamp()
    session['cp_otp'] = otp
    session['cp_email'] = email
    session['cp_exp'] = exp_ts
    session['cp_verified'] = False
    session.modified = True
    session.cycle_key()

def _clear_cp_session(session):
    for k in ('cp_otp', 'cp_email', 'cp_exp', 'cp_verified'):
        session.pop(k, None)
    session.modified = True

# ===================== A) POST-LOGIN: Change password WITH OTP =====================
User = get_user_model()

# ---------- Config ----------
OTP_TTL = timedelta(minutes=10)
REQUIRE_ACTIVE_FOR_RESET = True   # Forgot-password lookup only returns active users

# ---------- Helpers ----------
def _norm(s: str) -> str: return (s or "").strip()
def _norm_lower(s: str) -> str: return (s or "").strip().lower()

def _find_user_by_email(email: str):
    qs = User.objects.filter(email__iexact=email)
    if REQUIRE_ACTIVE_FOR_RESET:
        qs = qs.filter(is_active=True)
    return qs.first()

def _set_fp_session(session, email: str, otp: str):
    exp_ts = (tmz.now() + OTP_TTL).timestamp()
    session['fp_otp'] = otp
    session['fp_email'] = email
    session['fp_exp'] = exp_ts
    session['fp_verified'] = False
    session.modified = True
    session.cycle_key()

def _clear_fp_session(session):
    for k in ('fp_otp', 'fp_email', 'fp_exp', 'fp_verified'):
        session.pop(k, None)
    session.modified = True

def _set_cp_session(session, email: str, otp: str):
    exp_ts = (tmz.now() + OTP_TTL).timestamp()
    session['cp_otp'] = otp
    session['cp_email'] = email
    session['cp_exp'] = exp_ts
    session['cp_verified'] = False
    session.modified = True
    session.cycle_key()

def _clear_cp_session(session):
    for k in ('cp_otp', 'cp_email', 'cp_exp', 'cp_verified'):
        session.pop(k, None)
    session.modified = True

# ===================== A) POST-LOGIN: Change password WITH OTP (no current pwd) =====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def password_change_send_otp(request):
    """
    Step 1 (post-login): send OTP to the signed-in user's email (no current password required).
    """
    user = request.user
    if not user.email:
        return Response({'error': 'No email on file'}, status=400)

    otp = get_random_string(6, '0123456789')
    _set_cp_session(request.session, user.email.lower(), otp)

    send_mail(
        subject='Password Change OTP',
        message=f'Your OTP is {otp}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return Response({'message': 'OTP sent to your email', 'proceed': True}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def password_change_verify_otp(request):
    """
    Step 2 (post-login): verify OTP for change-password flow.
    """
    otp_in = _norm(request.data.get('otp'))
    s = request.session
    cp_otp, cp_email, cp_exp = s.get('cp_otp'), s.get('cp_email'), s.get('cp_exp')

    if not (cp_otp and cp_email and cp_exp):
        return Response({'error': 'OTP expired or not found'}, status=400)
    if tmz.now().timestamp() > float(cp_exp):
        return Response({'error': 'OTP has expired'}, status=400)
    if otp_in != cp_otp:
        return Response({'error': 'Invalid OTP'}, status=400)
    if request.user.email and request.user.email.lower() != cp_email:
        return Response({'error': 'Email mismatch'}, status=400)

    s['cp_verified'] = True
    s.modified = True
    return Response({'message': 'OTP verified'}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def password_change_confirm(request):
    """
    Step 3 (post-login): set new password after OTP verified.
    """
    new_password = _norm(request.data.get('new_password'))
    if not new_password:
        return Response({'error': 'New password is required'}, status=400)

    s = request.session
    if not s.get('cp_verified'):
        return Response({'error': 'OTP verification required'}, status=400)

    user = request.user
    user.set_password(new_password)
    user.save()

    _clear_cp_session(s)
    request.session.cycle_key()
    return Response({'message': 'Password changed. Please log in again.'}, status=200)

# ===================== B) PRE-LOGIN: Forgot password WITH OTP (email → otp → new pwd) =====================

@api_view(['POST'])
@permission_classes([AllowAny])
def password_forgot_send(request):
    """
    Step 1 (pre-login): accept email, send OTP if user exists.
    Returns explicit error message when email is not registered.
    """
    email = _norm_lower(request.data.get('email'))
    try:
        validate_email(email)
    except ValidationError:
        return Response({'error': 'Invalid email'}, status=400)

    user = _find_user_by_email(email)
    if not user:
        # EXPLICIT message for non-existent email (as requested)
        return Response(
            {'message': 'Wrong Email kindly use registered email', 'proceed': False, 'code': 'not_found'},
            status=200
        )

    otp = get_random_string(6, '0123456789')
    _set_fp_session(request.session, email, otp)

    send_mail(
        subject='Password Reset OTP',
        message=f'Your OTP is {otp}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    return Response({'message': 'OTP sent to your email', 'proceed': True, 'code': 'sent'}, status=200)

@api_view(['POST'])
@permission_classes([AllowAny])
def password_forgot_verify(request):
    """
    Step 2 (pre-login): verify {email, otp}.
    """
    email = _norm_lower(request.data.get('email'))
    otp_in = _norm(request.data.get('otp'))

    s = request.session
    s_otp, s_email, s_exp = s.get('fp_otp'), s.get('fp_email'), s.get('fp_exp')

    if not (s_otp and s_email and s_exp):
        return Response({'error': 'OTP expired or not found'}, status=400)
    if email != s_email:
        return Response({'error': 'Email does not match OTP request'}, status=400)
    if tmz.now().timestamp() > float(s_exp):
        return Response({'error': 'OTP has expired'}, status=400)
    if otp_in != s_otp:
        return Response({'error': 'Invalid OTP'}, status=400)

    s['fp_verified'] = True
    s.modified = True
    return Response({'message': 'OTP verified successfully'}, status=200)

@api_view(['POST'])
@permission_classes([AllowAny])
def password_forgot_reset(request):
    """
    Step 3 (pre-login): set new password for the verified email.
    """
    s = request.session
    if not s.get('fp_verified'):
        return Response({'error': 'OTP verification required'}, status=400)

    new_password = _norm(request.data.get('new_password'))
    if not new_password:
        return Response({'error': 'New password is required'}, status=400)

    email = s.get('fp_email')
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    user.set_password(new_password)
    user.save()

    request.session.flush()
    resp = Response({'message': 'Password updated successfully. Please log in again.'}, status=200)
    resp.delete_cookie('sessionid')
    return resp

# ----------------- 👤 Profile ------------------

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
#-----------------------------------search_doc-------------------------------------------
STATE_CITIES = {
    "telangana": ["Hyderabad", "Warangal", "Nizamabad"],
    "andhra pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati"],
    "karnataka": ["Bangalore", "Mysore", "Hubli"],
    "tamil nadu": ["Chennai", "Coimbatore", "Madurai"],
    "kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode"],
    "maharashtra": ["Mumbai", "Pune", "Nagpur"],
    "gujarat": ["Ahmedabad", "Surat", "Vadodara"],
    "delhi": ["New Delhi", "South Delhi", "North Delhi"],
    "uttar pradesh": ["Lucknow", "Kanpur", "Varanasi"],
    "west bengal": ["Kolkata", "Howrah", "Durgapur"],
}

INDIA_CITIES = [
    "Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad",
    "Ahmedabad", "Kolkata", "Pune", "Jaipur", "Lucknow",
    "Bhopal", "Patna", "Chandigarh", "Indore", "Nagpur"
]

REGIONAL_GROUPS = {
    "south india": ["telangana", "andhra pradesh", "karnataka", "tamil nadu", "kerala"],
    "north india": ["punjab", "delhi", "uttar pradesh", "haryana"],
    "west india": ["maharashtra", "gujarat", "rajasthan"],
    "east india": ["west bengal", "odisha", "bihar", "jharkhand"],
    "india": list(STATE_CITIES.keys())  # shorthand for all
}


DOCTOR_DATA = []
DOCTOR_CSV_PATH = os.path.join(settings.BASE_DIR, 'datasets', 'doctor1.csv')

with open(DOCTOR_CSV_PATH, 'r') as f:
    reader = csv.DictReader(f)
    DOCTOR_DATA = [row for row in reader]
    
def fetch_nearby_places(lat, lng, specialization):
    url = (
        f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        f"?location={lat},{lng}&radius=5000&type=doctor"
        f"&key={settings.GOOGLE_API_KEY}"
    )
    print("Fetching from:", url)
    response = requests.get(url)
    results = response.json().get("results", [])

    filtered_results = [
        r for r in results if (
            specialization.lower() in r.get("name", "").lower() or
            "clinic" in r.get("name", "").lower() or
            "hospital" in r.get("name", "").lower()
        )
    ]

    print(f"Found {len(filtered_results)} results near {lat},{lng} for {specialization}")
    return filtered_results or results

# 🔎 Text-based query to search across India
def resolve_location_text_to_cities(location_text):
    location_key = location_text.strip().lower()

    if location_key in REGIONAL_GROUPS:
        states = REGIONAL_GROUPS[location_key]
        return sum([STATE_CITIES.get(state, []) for state in states], [])

    # Match full country
    if "india" in location_key:
        return INDIA_CITIES

    # Match known state
    for state in STATE_CITIES:
        if state in location_key:
            return STATE_CITIES[state]

    # Try a fallback: just use the raw input
    return [location_text]

def fetch_places_by_text_query(specialization, location_text, per_state_limit=5):
    target_cities = resolve_location_text_to_cities(location_text)

    all_results = []
    used_cities = []
    seen_place_ids = set()

    city_limit = per_state_limit
    max_total_results = len(target_cities) * city_limit

    for city in target_cities:
        query = f"{specialization} clinics in {city}"
        url = (
            f"https://maps.googleapis.com/maps/api/place/textsearch/json"
            f"?query={query.replace(' ', '+')}&region=in&key={settings.GOOGLE_API_KEY}"
        )
        print(f"Fetching from: {url}")
        response = requests.get(url)

        if response.status_code != 200:
            continue

        results = response.json().get("results", [])
        added_count = 0

        for res in results:
            place_id = res.get("place_id")
            if place_id and place_id not in seen_place_ids:
                all_results.append(res)
                seen_place_ids.add(place_id)
                added_count += 1
            if added_count >= city_limit:
                break

        if added_count > 0:
            used_cities.append(city)

        if len(all_results) >= max_total_results:
            break

    print(f"✅ Collected {len(all_results)} from cities: {used_cities}")
    return all_results, used_cities



# 🔎 Fetch additional info per place

def get_place_details(place_id):
    url = (
        f"https://maps.googleapis.com/maps/api/place/details/json"
        f"?place_id={place_id}&fields=name,formatted_address,website"
        f"&key={settings.GOOGLE_API_KEY}"
    )
    response = requests.get(url)
    if response.status_code == 200:
        return response.json().get("result", {})
    return {}

# 🔍 Choose search logic based on mode

def get_doctor_results(specialization, mode, lat=None, lng=None, location_text=None):
    if mode == "Nearby" and lat and lng:
        results = fetch_nearby_places(lat, lng, specialization)
        return results, []  # No cities used
    else:
        return fetch_places_by_text_query(specialization, location_text)


# 🔁 Select fake doctor if real name is not found

def get_random_fake_doctor_by_specialization(specialization):
    filtered_doctors = [doc for doc in DOCTOR_DATA if doc["Specialization"].lower() == specialization.lower()]
    if filtered_doctors:
        return random.choice(filtered_doctors)
    else:
        return {
            "Name": "Dr. Priya Sharma",
            "Specialization": specialization,
            "Photo": "https://example.com/default-doctor.png"
        }

# 🧪 Check for diagnostic centers

def is_diagnostic_place(name):
    keywords = ["lab", "diagnostic", "scan", "imaging", "pathology", "center"]
    return any(keyword in name.lower() for keyword in keywords)

# 🧠 Try extracting real doctor names

import re

def extract_doctor_name_from_place_name(text):
    # Normalize all variations of "Dr"
    text = re.sub(r"\bDr[.\s]*", "Dr. ", text, flags=re.IGNORECASE)

    # Match name after "Dr." and stop before clinic/specialty terms
    match = re.search(r"Dr\. ([A-Z][A-Za-z\.]*\s?){1,4}", text)
    
    if match:
        name = match.group(0).strip()
        
        # Clean up trailing terms like MD, DNB, Clinic, etc.
        name = re.split(r"[,;:\(\)\-]| MD| DNB| Clinic| Hospital| Centre| Skin| Dental| Eye| Heart| ENT| Ortho| Physio| Hair", name, 1)[0].strip()

        # Normalize spacing
        name = re.sub(r"\s{2,}", " ", name)
        return name

    return None






# 🔄 Main search endpoint

def search_doctors_by_symptom(request):
    symptom = request.GET.get("symptom")
    lat = request.GET.get("lat")
    lng = request.GET.get("lng")
    mode = request.GET.get("mode", "Nearby")
    location_text = request.GET.get("location_text")

    if not symptom:
        return JsonResponse({"error": "Missing symptom"}, status=400)

    if mode == "Nearby" and not (lat and lng):
        return JsonResponse({"error": "Missing location for nearby search"}, status=400)

    # info = map_symptom_to_specialization_and_severity(symptom)
    info = predict_specialist(symptom)
    specialization = info["specialist"]
    # severity = info["severity"]

    places = get_doctor_results(specialization, mode, lat, lng, location_text)
    places, source_cities = get_doctor_results(specialization, mode, lat, lng, location_text)

    matched_doctors = []
    diagnostics = []

    for place in places:
        name = place.get("name", "")
        place_id = place.get("place_id")
        location = place.get("geometry", {}).get("location", {})
        lat = location.get("lat")
        lng = location.get("lng")

        details = get_place_details(place_id)
        # print("Place details for debugging:")
        # print(details)
        full_address = details.get("formatted_address") or place.get("vicinity", "")
        if is_diagnostic_place(name):
            diagnostics.append({
                "name": name,
                "address": full_address,
                "location": {"lat": lat, "lng": lng},
                "type": "Diagnostic Center"
            })
            continue

        extracted_name = extract_doctor_name_from_place_name(name)
        if extracted_name:
            doctor_name = extracted_name
            specialization_from_title = specialization
            photo = assign_photo_by_gender(name)
        else:
            fake_doctor = get_random_fake_doctor_by_specialization(specialization)
            doctor_name = fake_doctor["Name"]
            specialization_from_title = fake_doctor["Specialization"]
            photo = fake_doctor["Photo"]

        matched_doctors.append({
            "name": doctor_name,
            "clinic": name,
            "address": full_address,
            "specialization": specialization_from_title,
            "photo": photo,
            "location": {"lat": lat, "lng": lng},
            "place_id": place_id,
        })
    print(matched_doctors)
    # if severity == "serious":
    #     matched_doctors = [d for d in matched_doctors if "hospital" in d["clinic"].lower()] or matched_doctors
    
    

    return JsonResponse({
    "doctors": matched_doctors,
    "diagnostics": diagnostics,
    "source_cities": source_cities  # 🆕 frontend can show this
})


    
#-------------------------------chatbot---------------------------------------------
def run_rag_symptom_only(fields):
    # ✅ This path remains exactly as before (no profile logic)
    symptom     = (fields.get('symptom') or '').strip()
    severity    = (fields.get('severity') or '').strip()
    duration    = (fields.get('duration') or '').strip()
    description = (fields.get('description') or '').strip()

    current_q = f"Symptom: {symptom}, Severity: {severity}, Duration: {duration}, Description: {description}."
    return query_rag(
        input_text=current_q,
        index_path="api/symptom_index.faiss",
        data_path="api/symptom_data.pkl",
        top_k=5,
    )

def run_personalised_rag_with_profile(message, user):
    msg = (message or "").strip().lower()

    # deterministic shortcuts
    if msg in ["what is my age", "tell me my age", "how old am i"]:
        return f"You are {user.age} years old."
    if msg in ["what is my weight", "tell me my weight", "how much do i weigh"]:
        return f"Your weight is {user.weight} kg."
    if msg in ["what is my height", "tell me my height", "how tall am i"]:
        return f"Your height is {user.height} cm."
    if msg in ["what is my diet", "tell me my diet", "what is my diet preference"]:
        return f"Your diet preference is {user.diet_preference}."

    live_profile = f"Age {user.age}, Weight {user.weight} kg, Height {user.height} cm, Diet: {user.diet_preference}."
    raw = query_rag_profile(
        question=(message or "").strip(),
        live_profile_text=live_profile,
        index_path="api/profile_index.faiss",
        data_path="api/profile_data.pkl",
        top_k=5,
        instruction_mode="profile"
    )

    # Only keep numbers if explicitly asked about them
    needs_numbers = any(k in msg for k in ["age", "weight", "height"])
    return raw if needs_numbers else _strip_profile_numbers(raw)

def run_rag_symptom_profile(fields, user):
    symptom     = (fields.get('symptom') or '').strip()
    severity    = (fields.get('severity') or '').strip()
    duration    = (fields.get('duration') or '').strip()
    description = (fields.get('description') or '').strip()

    question = f"Symptom: {symptom}, Severity: {severity}, Duration: {duration}, Description: {description}."
    live_profile = f"Age {user.age}, Weight {user.weight} kg, Height {user.height} cm, Diet: {user.diet_preference}."

    raw = query_rag_profile(
        question=question,
        live_profile_text=live_profile,
        index_path="api/symptom_profile_index.faiss",
        data_path="api/symptom_profile_data.pkl",
        top_k=5,
        instruction_mode="symptom_profile"
    )
    # Symptom answers rarely need numbers → strip by default
    return _strip_profile_numbers(raw)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def ask_model(request):
    print(request.user.age)
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
        mode = data.get("mode")
        msg_type = data.get("type")

        if mode not in ["general", "personalised"]:
            return JsonResponse({"error": "Invalid mode"}, status=400)
        if msg_type not in ["text", "form"]:
            return JsonResponse({"error": "Invalid type"}, status=400)

        if msg_type == "text":
            message = data.get("message")
            if not message:
                return JsonResponse({"error": "Message is required"}, status=400)
            if mode == "general":
                response = generate_answer(message)
            else:
                response = run_personalised_rag_with_profile(message, request.user)
        elif msg_type == "form":
            fields = data.get("fields", {})
            if not fields.get("symptom"):
                return JsonResponse({"error": "Symptom is required"}, status=400)

            if mode == "general":
                response = run_rag_symptom_only(fields)
            else:
                response = run_rag_symptom_profile(fields, request.user)

        return JsonResponse({"response": response})

    except Exception as e:
        import traceback
        print("🔥 Symptom Form Error:\n", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)

#--------------------------------healthmetrics----------------------------------------------
class AddHealthMetricView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = HealthMetricSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TrendDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        metric = request.query_params.get('type')  # e.g., 'heart_rate'
        limit = int(request.query_params.get('days', 7))

        if metric not in ['heart_rate', 'steps', 'sleep_duration', 'bmi', 'weight']:
            return Response({'error': 'Invalid metric type'}, status=400)

        print(f"\n🔍 Trend Debug Start for metric: {metric}, limit: {limit}")

        # ✅ Use India timezone explicitly for correct day grouping
        local_tz = timezone("Asia/Kolkata")

        # Step 1: Filter valid rows
        filtered = (
            HealthMetric.objects
            .filter(user=request.user)
            .exclude(**{f"{metric}": None})
            .exclude(**{f"{metric}": 0})
            .annotate(day=TruncDate('timestamp', tzinfo=local_tz))  # ✅ Timezone aware
        )

        print(f"✅ Filtered rows count (non-null & non-zero): {filtered.count()}")

        # Step 2: Aggregate by day
        if metric in ['steps', 'sleep_duration']:
            aggregated = filtered.values('day').annotate(val=Max(metric)).order_by('-day')
        else:
            aggregated = filtered.values('day').annotate(val=Avg(metric)).order_by('-day')

        aggregated_list = list(aggregated)

        print("📅 Available valid days (descending):")
        for entry in aggregated_list:
            print(f"  {entry['day']} → {entry['val']}")

        # Step 3: Slice and reverse for chart
        sliced = aggregated_list[:limit][::-1]

        print("\n📈 Final chart labels and values:")
        labels = []
        values = []
        for entry in sliced:
            label = entry['day'].strftime('%d %b')
            val = round(entry['val'], 2)
            labels.append(label)
            values.append(val)
            print(f"  {label} → {val}")

        print("🔚 Trend Debug End\n")

        return Response({
            'labels': labels,
            'values': values
        })

