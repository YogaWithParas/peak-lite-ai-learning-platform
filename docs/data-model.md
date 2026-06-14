# PEAK-Lite Data Model

## Why Data Design Matters

Data design is the foundation for every major workflow in PEAK-Lite. If the platform stores learner, instructor, and matching data clearly, the product can produce recommendations that are easier to trust, easier to explain, and easier to review.

Good data design matters here for five reasons:

1. It keeps learner and instructor records consistent across the platform.
2. It supports explainable matching instead of opaque AI output.
3. It separates recommendations from final human decisions.
4. It creates a reliable history for compliance, review, and improvement.
5. It makes future modules easier to add without redesigning the core system.

For a job-facing product, this is especially important. Educators and support teams need structured records they can act on, not just narrative AI output.

## Core Entities

The PEAK-Lite data model should center on a small set of stable entities:

- Learners: the people receiving support.
- Instructors: the people available to provide support.
- Taxonomies: the controlled lists used to classify needs, skills, subjects, modalities, and support types.
- Availability: the time, location, and capacity constraints that affect matching.
- Matching records: the inputs, scores, recommendations, explanations, and outcomes of each match cycle.
- Support plans: the approved plan for how a learner will be supported.
- Audit logs: the record of who changed what, when, and why.

These entities should be linked, but they should not be collapsed into a single large record. A normalized design keeps the system easier to maintain and easier to extend.

## Learner Tables

Learner data should support profile creation, matching, support planning, and later progress tracking.

### Learner

Stores the main learner profile.

- learner_id: primary identifier.
- external_reference: optional school or district reference.
- first_name
- last_name
- preferred_name
- date_of_birth
- grade_level
- primary_location_id
- status: active, inactive, archived.
- created_at
- updated_at

### Learner Profile

Stores profile details that influence support decisions.

- learner_profile_id
- learner_id
- learning_summary: concise description of learner needs and strengths.
- support_goals_summary
- communication_preferences
- modality_preferences: in-person, virtual, hybrid.
- notes_for_matching
- last_reviewed_at

### Learner Need

Links learners to one or more support needs from controlled taxonomy values.

- learner_need_id
- learner_id
- need_type_id
- severity_level
- priority_level
- identified_by
- identified_at
- active_flag

### Learner Strength

Stores strengths that can influence matching and planning.

- learner_strength_id
- learner_id
- strength_type_id
- description
- active_flag

### Learner Preference

Stores preferences relevant to assignment and support planning.

- learner_preference_id
- learner_id
- preference_type_id
- preference_value
- priority_level

### Learner Document or Evidence Reference

Stores references to non-structured evidence without putting large files directly into the core matching tables.

- learner_document_id
- learner_id
- document_type
- title
- storage_reference
- uploaded_by
- uploaded_at

## Instructor Tables

Instructor data should support profile creation, skills-based matching, workload review, and future scheduling.

### Instructor

Stores the main instructor profile.

- instructor_id: primary identifier.
- external_reference
- first_name
- last_name
- preferred_name
- primary_location_id
- employment_status
- profile_status: active, unavailable, archived.
- created_at
- updated_at

### Instructor Profile

Stores professional details used in matching.

- instructor_profile_id
- instructor_id
- role_title
- years_experience
- bio_summary
- support_approach_summary
- notes_for_matching
- last_reviewed_at

### Instructor Skill

Links instructors to the skills or support areas they can provide.

- instructor_skill_id
- instructor_id
- skill_type_id
- proficiency_level
- years_using_skill
- verified_flag

### Instructor Subject Coverage

Stores subject or instructional coverage areas.

- instructor_subject_id
- instructor_id
- subject_type_id
- confidence_level

### Instructor Modality Capability

Stores how an instructor can deliver support.

- instructor_modality_id
- instructor_id
- modality_type_id
- active_flag

### Instructor Capacity

Stores workload constraints at a practical level.

- instructor_capacity_id
- instructor_id
- max_active_learners
- current_active_learners
- max_weekly_hours
- current_weekly_hours
- effective_from
- effective_to

## Taxonomy Tables

Taxonomy tables provide controlled vocabulary. They prevent inconsistent labels such as storing the same support area under several slightly different names.

### Need Type

Defines learner need categories.

- need_type_id
- name
- description
- parent_need_type_id: optional hierarchy.
- active_flag

### Skill Type

Defines instructor skill categories.

- skill_type_id
- name
- description
- parent_skill_type_id
- active_flag

### Subject Type

Defines academic or support subject areas.

- subject_type_id
- name
- description
- active_flag

### Modality Type

Defines delivery modes.

- modality_type_id
- name: in-person, virtual, hybrid, small-group, one-to-one.
- description
- active_flag

### Preference Type

Defines preference categories for learners or instructors.

- preference_type_id
- name
- description
- active_flag

### Support Plan Type

Defines plan categories used after approval.

- support_plan_type_id
- name
- description
- active_flag

### Location

Defines campuses, sites, or service areas.

- location_id
- name
- location_type
- region
- active_flag

Taxonomy tables should be managed carefully. They are small, but they control reporting quality, AI input quality, and long-term consistency.

## Availability Tables

Availability needs its own structure because matching should consider more than skill fit. A strong instructor match is not useful if the person is not available at the right time, location, or workload level.

### Time Slot

Provides reusable time definitions.

- time_slot_id
- day_of_week
- start_time
- end_time
- label

### Learner Availability

Stores when a learner can receive support.

- learner_availability_id
- learner_id
- time_slot_id
- availability_status
- effective_from
- effective_to

### Instructor Availability

Stores when an instructor is available.

- instructor_availability_id
- instructor_id
- time_slot_id
- availability_status
- effective_from
- effective_to

### Location Availability Rule

Stores location constraints that affect delivery.

- location_availability_rule_id
- location_id
- modality_type_id
- rule_description
- active_flag

## Matching Tables

Matching is one of the most important platform workflows. The data model should preserve both the inputs and the outputs of each matching run so the platform can explain recommendations later.

### Match Request

Represents a matching event initiated for a learner.

- match_request_id
- learner_id
- requested_by
- request_reason
- request_status: pending, processing, reviewed, approved, rejected.
- created_at
- completed_at

### Match Snapshot

Stores the specific learner and instructor context used at match time. This is important because profiles can change later.

- match_snapshot_id
- match_request_id
- learner_snapshot_json or structured snapshot reference
- taxonomy_version
- availability_snapshot_reference
- created_at

### Match Candidate

Stores each instructor considered in a matching run.

- match_candidate_id
- match_request_id
- instructor_id
- eligibility_status
- exclusion_reason: if filtered out.
- created_at

### Match Score

Stores the explainable scoring outputs for each candidate.

- match_score_id
- match_candidate_id
- overall_score
- need_alignment_score
- skill_alignment_score
- availability_score
- location_score
- capacity_score
- confidence_level
- score_version

### Match Explanation

Stores plain-language reasons behind the score.

- match_explanation_id
- match_candidate_id
- strengths_summary
- risks_summary
- rationale_summary
- explanation_version

### AI Recommendation

Stores the ranked output from the AI-supported matching process.

- ai_recommendation_id
- match_request_id
- match_candidate_id
- recommendation_rank
- recommendation_status
- generated_at

### Match Review

Stores the human review of recommendations.

- match_review_id
- match_request_id
- reviewed_by
- review_outcome
- review_notes
- reviewed_at

### Match Decision

Stores the final approved or rejected decision for a candidate.

- match_decision_id
- match_request_id
- instructor_id
- decision_status: approved, rejected, waitlisted.
- decision_reason
- decided_by
- decided_at

## Support Plan Tables

Support plans should begin only after a human decision has been made. This keeps the operational plan separate from the recommendation stage.

### Support Plan

Stores the approved plan for learner support.

- support_plan_id
- learner_id
- instructor_id
- support_plan_type_id
- originating_match_request_id
- plan_status: draft, active, completed, cancelled.
- start_date
- end_date
- approved_by
- approved_at
- created_at
- updated_at

### Support Plan Goal

Stores the goals attached to a support plan.

- support_plan_goal_id
- support_plan_id
- goal_title
- goal_description
- success_measure
- target_date
- status

### Support Plan Service

Stores the actual support commitments.

- support_plan_service_id
- support_plan_id
- modality_type_id
- frequency_value
- frequency_unit
- duration_minutes
- location_id
- notes

### Support Plan Review

Stores periodic human reviews of the plan.

- support_plan_review_id
- support_plan_id
- reviewed_by
- review_date
- review_outcome
- review_notes

## Audit Log Tables

Because PEAK-Lite involves AI-supported recommendations and human approvals, traceability is essential. Audit tables should not be optional.

### Audit Event

Stores a general record of important actions.

- audit_event_id
- entity_type
- entity_id
- action_type: created, updated, deleted, reviewed, approved, rejected.
- actor_id
- actor_type
- action_timestamp
- reason_text

### Audit Field Change

Stores field-level differences for important records.

- audit_field_change_id
- audit_event_id
- field_name
- old_value
- new_value

### AI Activity Log

Stores model-related execution details without mixing them into business decision records.

- ai_activity_log_id
- match_request_id
- model_name
- model_version
- prompt_reference
- input_reference
- output_reference
- execution_timestamp
- executed_by_system_component

Audit data supports internal review, defensibility, quality assurance, and future policy requirements.

## Why AI Suggestions and Human Approvals Should Be Stored Separately

AI suggestions are not the same as approved decisions. They serve different purposes and should be stored in different tables.

AI suggestion records answer questions like:

- What did the system recommend?
- How was the recommendation ranked?
- What factors influenced the score?
- What model or rules produced the output?

Human approval records answer different questions:

- Who reviewed the recommendation?
- What decision did they make?
- Why did they approve, reject, or override it?
- When did that decision become operational?

Keeping these layers separate has practical benefits:

1. It preserves accountability. Staff remain responsible for final decisions.
2. It improves explainability. Teams can compare system output with the final human choice.
3. It supports auditing. Reviewers can see whether a plan followed or overrode AI advice.
4. It protects future model updates. New models can generate new suggestions without rewriting historical approvals.
5. It reduces legal and operational risk by making the final decision path explicit.

For this product, separation is not just good design. It is part of building trust.

## How This Design Supports Future Modules

This structure creates a stable foundation for future product growth.

### Scheduling

The availability, location, instructor capacity, and support plan service tables can support future scheduling workflows with minimal redesign. A scheduling module would mainly add calendar events, booking rules, and conflict handling.

### Assessments

Learner, learner need, learner strength, and support plan goal records provide a clear place to connect future assessment data. Assessment results can later feed profile updates and matching inputs without changing the core entity design.

### Progress Tracking

Support plans, goals, reviews, and audit records create the backbone for tracking learner progress over time. A future progress module can add check-ins, outcome measures, and milestone updates while still linking back to the approved plan.

### Communication

The separation between profiles, plans, reviews, and audit history makes it easier to introduce communication features such as notifications, parent updates, internal staff notes, or approval reminders. Messages can reference stable entity IDs instead of duplicating business records.

## Summary

The PEAK-Lite data model should be designed around clear operational entities, controlled taxonomies, explainable matching records, approved support plans, and full auditability. That approach gives educators a system they can trust today and gives the product team a structure that can expand into scheduling, assessments, progress tracking, and communication later.
