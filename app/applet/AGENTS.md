# User Preferences

- When presenting SQL that needs to be run, present the SQL clearly and use the phrase "UPDATE THIS SQL" to prompt the user.
- When performing database-related tasks (SQL updates, schema changes), first review `supabase_schema.sql` to ensure accuracy.
- **Always state intent before applying any code or logic changes.**
- **Linting**: Always run `lint_applet` after changes to verify code quality.
- **Atomic Edits**: Break complex changes into small, focused edits.
- **Root Cause**: When fixing bugs, briefly state the root cause.
- **Database Best Practice**: Always check `supabase_schema.sql` before writing SQL or database-interacting code.
- **Error Handling**: Automatically implement required error-handling patterns for database operations.
