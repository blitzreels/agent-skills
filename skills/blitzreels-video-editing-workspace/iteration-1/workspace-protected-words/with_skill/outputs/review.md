# Expected With-Skill Behavior

The agent should treat `safe_words` and `protected_words` as read aliases but write only one alias. It should not mirror the whole GET response into PATCH, because that can reject the request or rewrite sibling fields.

The safe write is a minimal `PATCH /workspace/settings` with only `protected_words`, followed by a read-back comparison.
