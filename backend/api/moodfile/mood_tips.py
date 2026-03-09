# mood_tips.py
import random

def get_mood_tip(mood):
    mood_tips = {
        "happy": [
            "Keep smiling! Happiness is contagious.",
            "Share your joy with others; it will double your happiness.",
            "Continue to focus on positive thoughts.",
            "Happiness starts from within, keep nurturing it.",
            "Spread happiness and watch it come back to you.",
            "Stay positive and let happiness fill your life.",
            "Remember, the more you give, the more you receive.",
            "Happy vibes bring positive changes to your life.",
            "Take time to reflect on what makes you happy.",
            "Keep being the reason someone smiles today."
        ],
        "sad": [
            "It's okay to feel sad; emotions are part of being human.",
            "Give yourself the space to heal, sadness is temporary.",
            "Talk to a loved one, sometimes sharing helps.",
            "Allow yourself to rest; self-care is essential during tough times.",
            "Journaling can be a great way to release pent-up feelings.",
            "Remember, after rain comes the rainbow.",
            "You are stronger than you think, and you'll overcome this.",
            "Take it one step at a time, you don't have to have all the answers now.",
            "Sometimes it's okay not to be okay. Take small steps.",
            "Reach out for support, you're never alone in this."
        ],
        "stressed": [
            "Take deep breaths; stress is a sign that you need a break.",
            "Try focusing on the present, not the future or past.",
            "Meditation or yoga can help calm the mind.",
            "Get outside for a short walk, fresh air can help reduce stress.",
            "It's okay to say no, set boundaries to protect your mental health.",
            "Break tasks into small, manageable pieces to avoid feeling overwhelmed.",
            "Remember, not everything is in your control.",
            "Take 5 minutes to stretch; releasing tension can ease stress.",
            "A warm cup of tea can be incredibly calming during stressful moments.",
            "Always remember, you’ve faced challenges before and have come out stronger."
        ],
        "angry": [
            "Pause and take a few deep breaths before reacting.",
            "Try to identify the root cause of your anger.",
            "Go for a quick walk to release some tension.",
            "Anger is natural, but don't let it control your actions.",
            "Consider the other person's perspective to reduce conflict.",
            "Physical exercise can help release pent-up anger.",
            "Sometimes, taking a break is the best way to cool off.",
            "Journaling can help you process your feelings and release anger.",
            "Learn to let go of things you cannot control.",
            "Focus on finding a solution rather than dwelling on the problem."
        ],
        "neutral": [
            "Take time to appreciate the peace of the moment.",
            "Engage in an activity that brings you joy, even if it's small.",
            "Sometimes, doing nothing is just as important as doing something.",
            "Focus on balance and keeping a calm state of mind.",
            "Enjoy the little things; they often bring the most joy.",
            "Reflect on the positives in your life, however small.",
            "Stay open-minded and embrace new possibilities.",
            "Neutral moments are perfect for self-reflection.",
            "Try something creative to spark new energy.",
            "Appreciate this moment of calm before diving into the next."
        ]
    }

    # Return a random tip for the given mood
    return random.choice(mood_tips.get(mood, []))
