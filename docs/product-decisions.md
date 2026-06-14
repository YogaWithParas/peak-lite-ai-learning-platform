# PEAK-Lite Product and Architecture Decisions

## Overview

This document explains the main product and architecture decisions behind PEAK-Lite. The goal is to be clear about why the project is structured this way, what tradeoffs were chosen, and why those choices fit an early-stage AI learning platform for educator-facing workflows.

The project is intentionally practical. It favors transparency, maintainability, and responsible AI usage over unnecessary complexity.

## Why Build This as a Full-Stack Web App

PEAK-Lite is best represented as a full-stack web application because the product includes multiple connected workflows:

- educator-facing profile management
- learner and instructor data handling
- matching and recommendation review
- support plan approval
- audit and history tracking

A full-stack web app is a good fit because it:

1. reflects how real internal education tools are typically delivered
2. supports a clear separation between frontend, backend, and data layers
3. allows the project to demonstrate both user experience and system design
4. makes it easier to extend the platform with future modules like scheduling and progress tracking
5. fits a portfolio project that aims to show end-to-end product thinking rather than isolated scripts

This approach makes the project more realistic and more useful as a professional showcase.

## Why Use Django REST Framework

Django REST Framework is a strong fit for the backend because PEAK-Lite needs structured APIs, reliable data handling, and clear model-to-endpoint workflows.

It was chosen because it:

1. works well for data-driven business applications
2. provides mature tools for serializers, validation, authentication, and API views
3. integrates naturally with relational data models
4. supports rapid backend development without requiring unnecessary custom infrastructure
5. is well suited to admin-style and internal workflow products

For this project, Django REST Framework provides a stable foundation for learner profiles, instructor profiles, matching records, recommendations, approvals, and audit logs.

## Why Use PostgreSQL

PostgreSQL is the preferred database because the platform relies on structured relational data with clear entity relationships.

It is a good fit because it:

1. handles relational data and joins well
2. supports consistency across complex linked records
3. scales better than lightweight local-only options for realistic application design
4. works well with Django and production-style backend architecture
5. leaves room for future features such as reporting, filtering, analytics, and structured history queries

The platform stores learners, instructors, availability, matching runs, support plans, and audit history. That data is relational by nature, so PostgreSQL is a more appropriate choice than a simple file-based database.

## Why Use Next.js and React

Next.js and React are a strong fit for the frontend because the product needs interactive educator-facing workflows rather than static pages.

This stack was chosen because it:

1. supports reusable UI components for forms, dashboards, and review flows
2. works well for state-driven interfaces such as profile editing and recommendation review
3. enables a modern frontend architecture commonly used in professional web applications
4. pairs well with API-driven backend design
5. makes it easier to expand the project into a polished portfolio application

Next.js also adds structure around routing and app organization, which helps keep the frontend maintainable as the project grows.

## Why Start with Rule-Based Matching Instead of Machine Learning

PEAK-Lite starts with weighted rule-based matching because it is the most responsible and practical version-one approach.

This decision was made because rule-based matching:

1. is easier to explain to educators
2. is easier to test and debug
3. does not require a large historical dataset
4. produces transparent scores instead of black-box outputs
5. is more appropriate for a sensitive education support workflow

For this project, the first priority is explainable matching, not predictive complexity. The matching system should help users understand why a recommendation was made before it tries to become more advanced.

## Why Use Mock AI First

The project uses a mock AI explanation layer in the first version instead of depending immediately on a live external model API.

This choice keeps the project grounded and manageable because it:

1. reduces dependency on external services early on
2. avoids cost and rate-limit concerns during initial development
3. makes testing simpler and more repeatable
4. lets the product define how AI explanations should appear before integrating a live model
5. reinforces that AI is an assistive layer, not the final decision-maker

This is a cleaner way to prove the workflow first and add model integration later when the product boundaries are clearer.

## Why Keep Matching Logic Modular

Matching logic should be modular because the scoring system has distinct parts with different purposes.

For example, support need fit, experience, availability, capacity, and teaching style each represent different decision factors. Keeping them modular makes the system easier to work with because it:

1. improves maintainability
2. makes individual scoring rules easier to test
3. supports clear score explanations
4. allows weights to be adjusted without rewriting the entire matcher
5. prepares the system for future hybrid recommendation methods

This is important both technically and product-wise. If one area needs to change, the team should be able to update that part without destabilizing the rest of the matching flow.

## Why Use Synthetic Data Only

PEAK-Lite should use synthetic data only in the demo and portfolio version of the project.

This is the right decision because it:

1. avoids privacy concerns tied to real student or staff records
2. keeps the project professionally safe to share publicly
3. reduces compliance risk
4. allows the data model and workflows to be demonstrated without exposing sensitive information
5. supports ethical portfolio development in an education-related space

Because this project touches learner support decisions, using real student data would be inappropriate for a public demo application.

## Why Educator Approval Is Required

Educator approval is required because recommendations are advisory, not authoritative.

This is a core product rule because:

1. learner support decisions are sensitive
2. operational context may not be fully captured in structured data
3. AI or rules-based outputs can still miss important nuance
4. human accountability must remain clear
5. trust in the platform depends on keeping professionals in control

PEAK-Lite is designed to assist decision-making, not replace it. Final learner-instructor matches and support plans should always be reviewed, approved, or edited by educators.

## Why Documentation Comes Before Heavy Coding

This project puts documentation first so the product direction is clear before implementation becomes large and difficult to change.

That decision matters because early documentation:

1. clarifies the product scope
2. defines the architecture before code spreads across the stack
3. reduces wasted implementation effort
4. helps keep AI-assisted development aligned with explicit goals
5. produces a stronger portfolio artifact by showing product thinking, not just coding output

For PEAK-Lite, writing the core documents first helps lock down the data model, matching logic, AI boundaries, and approval workflow before deeper engineering work begins.

## Summary

The main decisions behind PEAK-Lite favor realistic architecture, explainable matching, modular system design, responsible AI usage, and human review. Django REST Framework, PostgreSQL, and Next.js or React provide a practical full-stack foundation. Rule-based matching and mock AI keep the first version transparent and manageable, while synthetic data and educator approval protect the project from avoidable risk.

This creates a product direction that is honest, professional, and strong enough to expand over time.
