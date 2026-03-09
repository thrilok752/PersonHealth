from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator

class User(AbstractUser):
     full_name = models.CharField(
        max_length=255,
        validators=[RegexValidator(regex="^[A-Za-z ]+$", message="Full name must contain only letters and spaces.")]
    )
     username = models.CharField(
        max_length=150,
        unique=True,
        validators=[RegexValidator(regex="^[A-Za-z0-9_]+$", message="Username can only contain letters, numbers, and underscores.")]
    )
     email = models.EmailField(unique=True)
     age = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(120)]
    )
     height = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(30.0), MaxValueValidator(250.0)]
    )
     weight = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(2.0), MaxValueValidator(300.0)]
    )
     gender = models.CharField(
        max_length=20,
        choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')],
        blank=True
    )
     diet_preference = models.CharField(
        max_length=20,
        choices=[('Vegetarian', 'Vegetarian'), ('Non-Vegetarian', 'Non-Vegetarian'), ('Vegan', 'Vegan')],
        blank=True
    )
     profile_photo = models.ImageField(
        upload_to='profile_photos/', null=True, blank=True
    )
     password = models.CharField(max_length=128)
     validators=[RegexValidator(regex=r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", message="Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.")]

     USERNAME_FIELD = 'username'
     REQUIRED_FIELDS = ['full_name','age','gender','height','weight','diet_preference']
    
    
     groups = models.ManyToManyField(
        "auth.Group",
        related_name="api_users",  # Change related_name to avoid conflict
        blank=True
    )
     user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="api_users_permissions",  # Change related_name to avoid conflict
        blank=True
    )

# Medicine Model
class Medicine(models.Model):
    name = models.CharField(max_length=255)
    usage = models.TextField()
    manufacturer = models.CharField(max_length=255)
    def __str__(self):
        return self.name

# Natural Remedy Model
class NaturalRemedy(models.Model):
    issue = models.CharField(max_length=255)
    remedies = models.TextField()
    duration = models.CharField(max_length=100, null=True, blank=True)
    usage_instruction = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.issue


# Appointments model
STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
)
class Appointments(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    clinic_name=models.CharField(max_length=100)
    doctor_name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    date = models.DateField()
    time = models.TimeField()
    booked_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    approved = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.doctor_name} - {self.date} {self.time}"

# Symptom Tracker Model
# class Symptom(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     symptom = models.CharField(max_length=255)
#     severity = models.CharField(max_length=50)
#     duration = models.IntegerField()
#     description = models.TextField()
#     timestamp = models.DateTimeField(auto_now_add=True)

# Mood Tracker Model
class Mood(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    mood = models.CharField(max_length=20, choices=[
        ('happy', 'Happy'),
        ('sad', 'Sad'),
        ('stressed', 'Stressed'),
        ('angry', 'Angry'),
        ('neutral', 'Neutral'),
    ])
    timestamp = models.DateTimeField(auto_now_add=True)
    
class FoodNutrition(models.Model):
    name = models.CharField(max_length=255, unique=True)
    calories = models.FloatField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fats = models.FloatField()

    def __str__(self):
        return self.name


# Nutrition Logger Model
class Nutrition(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    food = models.CharField(max_length=255)
    portions = models.IntegerField()
    calories = models.FloatField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fats = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.food} ({self.portions}x)"


class HealthMetric(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    heart_rate = models.FloatField(null=True, blank=True)
    steps = models.IntegerField(null=True, blank=True)
    sleep_duration = models.IntegerField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    bmi = models.FloatField(null=True, blank=True)

    source = models.CharField(
    max_length=20,
    choices=[('wearable', 'wearable'), ('profile_update', 'profile_update')],
    default='wearable'
)

    timestamp = models.DateTimeField(auto_now_add=True)
    date = models.DateField(auto_now_add=True)  # ✅ helps PostgreSQL optimize trends

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.source}"

# Daily Wellness Quote Model
class WellnessQuote(models.Model):
    quote = models.TextField()
    author = models.CharField(max_length=255)
    def __str__(self):
        return f'"{self.quote[:50]}..." — {self.author}'


class WaterIntake(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    intake_ml = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
