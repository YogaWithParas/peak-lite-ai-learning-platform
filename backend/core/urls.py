from rest_framework.routers import DefaultRouter

from .views import InstructorViewSet, LearnerViewSet, LearningPlanViewSet, MatchRecommendationViewSet

router = DefaultRouter()
router.register("learners", LearnerViewSet, basename="learner")
router.register("instructors", InstructorViewSet, basename="instructor")
router.register("match-recommendations", MatchRecommendationViewSet, basename="match-recommendation")
router.register("learning-plans", LearningPlanViewSet, basename="learning-plan")

urlpatterns = router.urls
