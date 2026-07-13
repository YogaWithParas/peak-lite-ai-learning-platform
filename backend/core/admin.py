from django.contrib import admin

from .models import Instructor, Learner, LearningPlan, MatchRecommendation, Profile

admin.site.register(Profile)
admin.site.register(Learner)
admin.site.register(Instructor)
admin.site.register(MatchRecommendation)
admin.site.register(LearningPlan)
