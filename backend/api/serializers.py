from rest_framework import serializers
from .models import *

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = '__all__'

class NaturalRemedySerializer(serializers.ModelSerializer):
    class Meta:
        model = NaturalRemedy
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointments
        fields = '__all__'

# class SymptomSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Symptom
#         fields = '__all__'

class MoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mood
        fields = ['mood']  # Only accept mood from frontend


class FoodNutritionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodNutrition
        fields = '__all__'

class NutritionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nutrition
        fields = '__all__'

class HealthMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthMetric
        fields = '__all__'
        read_only_fields = ['id', 'timestamp', 'user']

class WellnessQuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WellnessQuote
        fields = '__all__'

class WaterIntakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterIntake
        fields = '__all__'
        read_only_fields = ['user', 'timestamp']


class UserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.ImageField(required=False, allow_null=True)
    class Meta:
        model = User
        fields = ['id', 'full_name', 'username', 'email', 'age', 'height', 'weight', 'gender', 'diet_preference', 'profile_photo','password']
        
    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password(validated_data['password'])  # ✅ Hashes password correctly!
        user.save()
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'username', 'email', 'age', 'height', 'weight', 'gender', 'diet_preference', 'profile_photo']
