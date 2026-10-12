# Shared template and icon workflow

Use for creation and updates in every library, including authorized related records.
Refetch live templates before selection; IDs in library references are hints.
Select the template and icon from the relevant library reference. App website icons
and explicit no-template exceptions remain library-specific.

- Creation must apply the selected live template, not merely copy its icon. With
  Notion create_pages, pass `template_id` on each page and omit `content`; override
  defaults only with requested properties. Do not assume a database/view default
  is automatically applied by the connector. Related-record creation follows the
  related database's templates, never the source library's template.
- Wait for any background creation task, then refetch to verify template defaults
  and icon; task success alone does not mean template application has finished.
  Blank template bodies are normal and do not prove failure. If pending, use bounded
  refetches before dependent edits. Preserve explicit property overrides.
  `allow_async: false` waits for page creation, not the separate template job.
  Space pending refetches with backoff (for example 5, 15, then 30 seconds); rapid
  repeated reads are not evidence of completion. At the observation timeout, report
  template completion as unconfirmed, not failed. For a blank template without
  distinct defaults, explicit creation properties cannot prove template application.
  Record missing-icon repair separately; once repaired, the icon can no longer show
  whether the background template job would have supplied it later.
- If a known matching template cannot be applied, report the limitation before
  creation rather than silently creating blank. If creation already happened, inspect
  that page, preserve content, and repair its icon where supported; report template
  application and icon repair separately. Icon repair never proves template success.
  Never recreate the page to retry. Missing-template creation is allowed only by a
  library's explicit documented exception; otherwise clarify before affected creation.
- On updates, verify template conventions and icon without reapplying the template
  or resetting existing data. Icon recovery rules in library references do not waive
  the creation requirement above. Refresh temporary uploaded-icon URLs from the live
  template; never persist an expiring signed URL as a reusable configuration value.

If an icon is missing, apply the verified library/template icon using supported tools
and refetch to verify; report unavailable repair support. Never guess an icon.
