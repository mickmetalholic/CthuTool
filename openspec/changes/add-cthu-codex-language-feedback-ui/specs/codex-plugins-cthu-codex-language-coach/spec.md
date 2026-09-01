## ADDED Requirements

### Requirement: Language coach requests progressive feedback presentation
When the language-coach detector injects coaching context, that context SHALL direct the active model to produce structured English feedback through the CthuCodex presentation tool when available and to preserve a prominent Markdown fallback.

#### Scenario: Presentation tool is available
- **WHEN** the language-coach hook activates for English prose and `cthu_language_feedback_present` is available to the active model
- **THEN** the injected context instructs the model to call the tool with the original prose, best natural rewrite, categorized notes, and compact variant
- **AND** it instructs the model to continue answering the user's actual request after presenting the feedback

#### Scenario: Presentation tool cannot be used
- **WHEN** the language-coach hook activates but the presentation tool is unavailable or its call fails
- **THEN** the injected context instructs the model to put a clearly identified English-polish section at the start of its final response
- **AND** the fallback includes the best natural rewrite and concise coaching notes
- **AND** the presentation failure does not prevent completion of the user's requested task

#### Scenario: Language coaching is inactive
- **WHEN** the language-coach detector decides the latest prompt is not English prose intent
- **THEN** it continues to return `{}`
- **AND** it does not request either custom UI or Markdown language feedback
