"""Stand-in for a real AI/LLM call.

Generates a first-pass learning plan draft. The important part of this
project isn't the draft text itself -- it's that LearningPlan keeps this
`ai_draft` strictly separate from `approved_plan`, so nothing generated here
ever reaches a learner or family without a human (case manager/admin)
reviewing and approving it first.
"""


def generate_ai_draft_stub(learner):
    needs = ", ".join(learner.learning_needs) if learner.learning_needs else "general academic support"
    return (
        f"Draft learning plan for {learner.full_name} ({learner.grade_level}). "
        f"Suggested focus areas: {needs}. "
        "This draft was generated automatically and must be reviewed and "
        "approved by a case manager or admin before it is shared or used."
    )
