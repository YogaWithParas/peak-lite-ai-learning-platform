# PEAK-Lite AI Workflow

## Overview

PEAK-Lite uses AI in a controlled and responsible way. The project is designed to show how AI can support educator workflows without replacing educator judgment.

In this platform, AI is used to assist development, help explain recommendations, and support future product expansion. It is not used to make final learner support decisions on its own.

## AI-Assisted Development Workflow Using GitHub Copilot

This project uses GitHub Copilot as a development assistant during planning, implementation, refactoring, and documentation.

In practice, GitHub Copilot supports work such as:

- generating draft code structures
- suggesting UI and backend implementation patterns
- helping scaffold documentation
- proposing refactors for cleaner organization
- speeding up repetitive development tasks

Copilot improves development speed, but it does not replace engineering review. All generated output still needs human verification before it becomes part of the project.

## Prompt-Driven Development

PEAK-Lite is built using a prompt-driven development workflow. That means development tasks begin with clear written instructions describing the intended feature, boundary, or document outcome.

This approach is useful because it:

1. keeps feature intent explicit
2. improves consistency across generated outputs
3. makes development decisions easier to review
4. supports rapid iteration on product ideas
5. creates a clearer record of how implementation choices were made

For a GitHub portfolio project, prompt-driven development also demonstrates how modern AI tooling can be used in a structured and professional way rather than in an ad hoc way.

## Human Review of AI-Generated Code

Human review is a required part of the workflow.

Any AI-generated code, document draft, or architectural suggestion should be reviewed for:

- correctness
- readability
- consistency with project goals
- security and privacy concerns
- maintainability
- unintended logic errors

This is especially important in a project related to education support. Even in a demo environment, AI-generated output should never be treated as automatically correct.

The expected workflow is:

1. define the task clearly
2. generate or draft with AI assistance
3. review the result manually
4. edit or reject weak output
5. keep the approved version under human control

## Mock AI Explanation Service in V1

Version 1 should use a mock AI explanation service rather than a live external model integration.

This means the system can simulate how AI-generated explanations might appear in the product without depending on a production AI API. In V1, the recommendation engine can produce structured scoring output, and the mock explanation layer can turn that output into readable recommendation summaries.

This is a good starting point because it:

1. keeps the architecture simple
2. avoids cost and API dependency during early development
3. makes local testing easier
4. lets the team design the explanation flow before adding real model calls
5. reinforces the rule that explanations are separate from final approvals

In other words, V1 can demonstrate the AI-assisted experience without pretending the model is making authoritative decisions.

## Future OpenAI or Claude API Integration

Future versions of PEAK-Lite can integrate external model APIs such as OpenAI or Claude to improve explanation quality and recommendation summaries.

Potential uses for future API integration include:

- generating plain-language explanations for match rankings
- summarizing match strengths and tradeoffs
- converting structured scoring data into educator-friendly review notes
- supporting internal workflow summaries for staff reviewers

Even with API integration, the model should remain an explanation and assistance layer. It should not be allowed to make final support assignments automatically.

If external models are added later, the project should also capture:

- which model was used
- which prompt or template was used
- what structured inputs were provided
- what output was returned
- when the output was generated

That record supports traceability and review.

## Why AI Suggestions Are Stored Separately from Human Approvals

AI suggestions and human approvals serve different purposes and should be stored separately.

AI suggestion records show:

- what the system recommended
- how candidates were ranked
- what explanation or rationale was generated
- what model or scoring process produced the output

Human approval records show:

- who reviewed the recommendation
- what decision was made
- whether the recommendation was accepted or changed
- why the final decision was approved, rejected, or edited

This separation matters because it:

1. preserves accountability
2. supports audit and review
3. makes overrides visible
4. prevents AI output from being confused with final policy decisions
5. allows the AI layer to improve later without rewriting historical human decisions

This is a core trust and governance requirement for the platform.

## Human-in-the-Loop Design

PEAK-Lite follows a human-in-the-loop design.

That means the system can assist with:

- ranking candidate instructors
- generating explanation summaries
- surfacing risks or tradeoffs
- reducing manual review effort

But educators remain responsible for:

- reviewing recommendations
- editing proposed matches
- approving final learner-instructor assignments
- approving support plans

This design keeps AI in a support role, not a decision replacement role.

## Risks

Responsible AI use requires clear acknowledgment of risk.

### Bias

If learner or instructor data is incomplete, inconsistent, or historically skewed, recommendations may reflect biased patterns or uneven assumptions.

### Overreliance on AI

If staff begin treating system recommendations as automatically correct, the quality of human review may drop.

### Privacy

Education-related records are sensitive. Even in a demo project, AI workflows must be designed carefully so data handling remains controlled.

### Inaccurate Recommendations

A recommendation can look reasonable while still being operationally weak or educationally inappropriate if the input data is wrong, incomplete, or oversimplified.

## Mitigation

PEAK-Lite addresses these risks with practical controls.

### Educator Approval

No recommendation should become a final match without educator review and approval. This is the primary safeguard against overreliance and weak automated decisions.

### Transparent Scoring

The rule-based scoring model makes recommendation logic visible. Reviewers can see why a candidate ranked well and where the tradeoffs are.

### Audit Logs

Audit logs should capture key system actions, AI-generated suggestions, reviews, and final approvals. This supports traceability, quality review, and accountability.

### No Real Student Data in Demo

The demo version of the project should not use real student data. Sample or synthetic data reduces privacy risk and keeps the portfolio project professionally appropriate.

## Summary

PEAK-Lite uses AI responsibly by keeping it inside a controlled support role. GitHub Copilot helps with AI-assisted development, prompt-driven workflows shape implementation, and human review remains required for all meaningful outputs.

In the product itself, Version 1 uses a mock AI explanation service, with room for future OpenAI or Claude integration. Even as the system becomes more capable, AI suggestions should remain separate from human approvals, and educators should stay in control of final decisions.
