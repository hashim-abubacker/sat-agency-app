# 07_Design_System.md

# Simple Agency Tool

**Version:** 2.0 (Foundation)

------------------------------------------------------------------------

# 1. Purpose

The Design System is the single source of truth for every visual and
interaction decision in Simple Agency Tool.

Goals:

-   Consistency
-   Speed
-   Accessibility
-   Reusability
-   Predictability
-   Scalability

Inspired by **Linear**, while remaining original in implementation.

------------------------------------------------------------------------

# 2. Product Philosophy

The interface should feel:

-   Calm
-   Fast
-   Focused
-   Minimal
-   Professional

Avoid unnecessary decoration.

Every screen should answer one primary question.

------------------------------------------------------------------------

# 3. UX Principles

## Progressive Disclosure

Show advanced options only when needed.

## One Primary Action

Every page has one clear CTA.

## Zero Learning Curve

Common actions should be obvious.

## Keyboard First

Every major action should be available from the keyboard.

## Instant Feedback

Every interaction receives immediate visual feedback.

------------------------------------------------------------------------

# 4. Visual Language

## Style

-   Flat UI
-   Subtle depth
-   Large whitespace
-   Thin borders
-   Rounded corners
-   Minimal shadows

------------------------------------------------------------------------

# 5. Design Tokens

## Colors

Primary: #111827

Accent: #4F46E5

Background: #FAFAFA

Surface: #FFFFFF

Border: #E5E7EB

Text Primary: #111827

Text Secondary: #6B7280

Success: #16A34A

Warning: #F59E0B

Danger: #DC2626

Info: #0EA5E9

Future: Dark theme uses semantic tokens only.

------------------------------------------------------------------------

# 6. Typography

Primary Font: Inter

Fallback: system-ui

Scale

H1 32

H2 28

H3 24

H4 20

Body 14

Caption 12

Button 14 Medium

Numbers should use tabular figures.

------------------------------------------------------------------------

# 7. Spacing System

Base Unit: 8px

Scale:

4

8

12

16

24

32

40

48

64

96

Never use arbitrary spacing.

------------------------------------------------------------------------

# 8. Layout

Desktop

-   12-column grid
-   Sidebar 256px
-   Header 64px
-   Max content width 1440px

Tablet

-   8-column grid

Mobile

-   Single column

------------------------------------------------------------------------

# 9. Component Standards

Every component must define:

-   Purpose
-   Anatomy
-   Variants
-   Sizes
-   States
-   Accessibility
-   Responsive behaviour
-   Keyboard support
-   Loading state
-   Empty state
-   Error state
-   Anti-patterns

------------------------------------------------------------------------

# 10. Core Components

Buttons

Inputs

Textarea

Select

Combobox

Search

Command Palette

Cards

Tables

Badges

Avatars

Dialogs

Drawers

Dropdowns

Tabs

Breadcrumbs

Pagination

Kanban Cards

Calendar

Timeline

Toasts

Skeletons

Empty States

------------------------------------------------------------------------

# 11. Motion

Hover

120ms

Transitions

150--200ms

Dialogs

200ms

Drag-and-drop

Natural easing with live preview.

Respect reduced-motion preferences.

------------------------------------------------------------------------

# 12. Keyboard Shortcuts

/

Global Search

G then D

Dashboard

G then C

Clients

G then P

Projects

Esc

Close Dialog

Ctrl/Cmd + K

Command Palette

------------------------------------------------------------------------

# 13. Responsive Rules

Desktop

Full productivity experience.

Tablet

Reduce spacing.

Collapse sidebar.

Mobile

Single column.

Sticky actions.

Touch-first controls.

------------------------------------------------------------------------

# 14. Accessibility

WCAG AA

Visible focus ring

44×44 touch targets

Semantic HTML

ARIA labels

Screen reader support

Never communicate status using colour alone.

------------------------------------------------------------------------

# 15. Performance

First load \<2 seconds

Search \<200ms

Navigation \<200ms

Optimistic UI for mutations.

------------------------------------------------------------------------

# 16. UX Writing

Buttons use verbs.

Examples:

Create Project

Assign Task

Archive Client

Error messages explain what happened and how to recover.

Empty states always include one primary action.

------------------------------------------------------------------------

# 17. Design QA Checklist

Every new component must include:

-   Responsive layout
-   Keyboard navigation
-   Accessible labels
-   Loading state
-   Empty state
-   Error state
-   Dark-mode compatible tokens
-   Reusable API
-   Documentation
-   Unit tests where applicable

------------------------------------------------------------------------

# 18. Definition of Done

A feature is complete only when:

-   Matches design tokens
-   Meets accessibility requirements
-   Uses reusable components
-   Supports responsive layouts
-   Handles loading, success, empty and error states
-   Passes design review
-   Passes QA
-   Is documented

------------------------------------------------------------------------

# Future Roadmap

-   Dark Mode
-   Theme customization
-   Design token export
-   Figma Variables
-   Component playground
-   Advanced motion library
-   Multi-brand support
