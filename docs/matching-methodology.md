# PEAK-Lite Matching Methodology

## Overview

PEAK-Lite uses an explainable learner-instructor matching process designed for an education setting. The goal is not to let AI make staffing decisions on its own. The goal is to help educators review strong candidate matches faster, with clear reasons behind each recommendation.

In Version 1, the platform uses weighted rule-based matching. This approach gives the team a practical starting point that is easier to understand, easier to test, and easier to justify when working with learner support decisions.

## Why V1 Uses Weighted Rule-Based Matching

Version 1 uses weighted rule-based matching because it is the most reliable and transparent way to launch the product.

This approach works well for an early-stage portfolio project because:

1. It is easy to explain to educators and reviewers.
2. It produces consistent results from structured profile data.
3. It can be validated without needing a large historical dataset.
4. It makes score components visible instead of hiding them inside a black-box model.
5. It creates a strong baseline that future recommendation methods can improve on.

In practical terms, the system compares learner needs, instructor strengths, availability, workload, and support style. Each area contributes a defined number of points to the final score.

## Why This Is Better Than Pure AI in a Sensitive Education Setting

Education support decisions affect real learners, real staff capacity, and real service quality. In a sensitive setting like this, a pure AI approach creates unnecessary risk.

Weighted rule-based matching is better for Version 1 because it offers:

1. Transparency: educators can see why a match scored well or poorly.
2. Control: product rules can be adjusted without retraining a model.
3. Predictability: the same input data produces the same scoring behavior.
4. Trust: staff can review recommendations based on visible factors.
5. Safer adoption: the system supports decision-making without replacing professional judgment.

Pure AI ranking may eventually add value, but it should not be the first or only decision layer in an education support workflow. PEAK-Lite should use AI to explain recommendations and surface patterns, not to make final decisions independently.

## Matching Score Breakdown

The Version 1 score totals 100 points. Each candidate instructor is evaluated against the same set of weighted criteria.

### 1. Support Need and Instructor Skill Match: 35 Points

This is the most important scoring area.

The system compares the learner's identified support needs with the instructor's listed skills and support capabilities. A higher score is given when the instructor has direct, relevant skill coverage for the learner's highest-priority needs.

Examples of factors:

- direct match between learner need categories and instructor skill categories
- strength of instructor proficiency level
- number of priority learner needs covered
- alignment with required support modality or service area

This scorer carries the most weight because support quality depends first on whether the instructor can actually meet the learner's needs.

### 2. Learning Difference Experience: 25 Points

This scorer measures whether the instructor has experience working with learning differences or support contexts similar to the learner's profile.

Examples of factors:

- experience with similar learning needs
- experience with comparable age or grade bands
- verified support background in related interventions
- evidence of past work in similar educational settings

This score is separate from the basic skill match because an instructor may have a listed skill without having enough practical experience in the specific support context.

### 3. Availability Overlap: 20 Points

This scorer measures whether the learner and instructor can realistically work together.

Examples of factors:

- overlap in weekly time slots
- modality compatibility, such as in-person or virtual support
- location compatibility
- consistency of available time windows

This matters because even a highly qualified instructor is not a strong operational match if scheduling constraints make service delivery unreliable.

### 4. Instructor Capacity: 10 Points

This scorer checks whether the instructor has enough workload room to take on additional support.

Examples of factors:

- current active learner count
- remaining weekly support hours
- local capacity thresholds
- near-capacity warning conditions

This score helps prevent the system from repeatedly recommending instructors who are already overloaded.

### 5. Teaching Style Fit: 10 Points

This scorer measures fit between learner preferences or support needs and the instructor's approach to teaching or support delivery.

Examples of factors:

- structured versus flexible support approach
- one-to-one versus small-group preference fit
- communication style compatibility
- modality and engagement preferences

This category has a smaller weight because style matters, but it should not override skill coverage or operational feasibility.

## How the Final Score Should Work

Each scorer should return its own point contribution based on a shared scoring contract. The final match score is the sum of all scorer outputs.

At a simple level:

- support need and instructor skill match: up to 35
- learning difference experience: up to 25
- availability overlap: up to 20
- instructor capacity: up to 10
- teaching style fit: up to 10
- total possible score: 100

This design makes recommendations easier to interpret. If one candidate scores lower, educators can see whether the issue is skill fit, lack of availability, low remaining capacity, or another specific factor.

## Why Each Scorer Should Be Modular

Each scoring area should be implemented as a separate module rather than as one large block of matching logic.

This is important for five reasons:

1. Maintainability: a single scorer can be updated without rewriting the full system.
2. Testability: each scoring rule can be verified on its own.
3. Explainability: the platform can show which scorer contributed which points.
4. Extensibility: new scorers can be added later without breaking the baseline design.
5. Product flexibility: weights and rules can be tuned as real usage feedback appears.

For example, if the team later decides that availability matters more than teaching style, the weighting can be adjusted without redesigning the learner or instructor profile model.

Modular scorers also support mixed recommendation strategies in future versions. A rules-based baseline, similarity signal, and historical outcome signal can each remain separate and still contribute to one ranked result.

## Decision Boundary: AI Explains, Educators Decide

PEAK-Lite should keep a clear decision boundary.

The system may:

- score candidate matches
- rank recommended instructors
- summarize why a candidate scored well
- highlight tradeoffs or risks for reviewer attention

The system should not:

- automatically finalize a learner-instructor assignment
- approve a support plan without human review
- replace educator judgment in sensitive support decisions

Final matches should be approved or edited by educators. This keeps responsibility with the human team and makes the platform more appropriate for real education workflows.

## Future Versions

Version 1 should remain simple and explainable. Future versions can become more intelligent without removing human review.

### Content-Based Similarity

A future version can compare learner and instructor profiles using richer profile similarity methods. Instead of only checking direct rule matches, the system could identify instructors whose past profile attributes closely resemble the learner's current needs.

This would improve recommendations when exact category matches are limited but strong related-fit signals exist.

### Historical Outcome Feedback

Once the product has enough data, future versions can learn from outcomes such as:

- support plan success trends
- educator approval behavior
- duration and stability of matches
- progress review results

This would allow the system to identify which kinds of matches tend to work well over time.

### Hybrid Recommendation System

The long-term direction should be a hybrid recommendation system.

That means combining:

- weighted rule-based scoring
- content-based similarity signals
- historical outcome feedback

This approach is stronger than replacing the current system outright. The rule-based layer provides stability and transparency, while learned signals improve ranking quality over time.

### LLM-Generated Explanations

Large language models can add value by turning structured score outputs into clear, readable explanations for educators.

For example, an LLM could summarize:

- why a candidate ranked highly
- which learner needs were well covered
- what operational tradeoffs exist
- why another candidate may still be worth review

This should remain an explanation layer, not a final decision layer. The scoring and approval process should stay grounded in structured data and human review.

## Summary

The PEAK-Lite matching methodology starts with weighted rule-based matching because it is transparent, practical, and well suited to a sensitive education setting. The Version 1 score uses five modular scorers across skill fit, relevant experience, availability, capacity, and teaching style.

Over time, the platform can add similarity methods, outcome feedback, hybrid ranking, and LLM-generated explanations. Even as the recommendation engine becomes more advanced, AI should explain recommendations rather than make final decisions, and educators should remain responsible for approving or editing matches.
