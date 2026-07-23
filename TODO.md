# RBAC Implementation — Step-by-Step Progress

## Steps

- [x] Plan confirmation
- [x] **Step 1**: Update `models/user.py` — Add role constants, change default to `"viewer"`
- [x] **Step 2**: Update `core/security.py` — Add `ROLE_RANK` dict and `get_role_rank()` helper
- [x] **Step 3**: Update `api/v1/endpoints/auth.py` — Embed role in JWT on login
- [x] **Step 4**: Update `api/deps.py` — Add hierarchy-based `require_role_hierarchy`, handle missing role claim in `get_current_user`
- [x] **Step 5**: Update `schemas/user.py` — Add `role` field to `UserUpdate`
- [x] **Step 6**: Create `models/audit_log.py` — New AuditLog model
- [x] **Step 7**: Register AuditLog in `models/__init__.py`
- [x] **Step 8**: Create `schemas/audit_log.py` — Simple audit log response schema (not needed, AuditLog is backend-only)
- [x] **Step 9**: Update `endpoints/users.py` — Consistent hierarchy checks, default `"viewer"`, wire audit logging
- [x] **Step 10**: Update `seed_db.py` — Change staff user role to `"viewer"`
- [x] **Step 11**: Update `main.py` — Add `staff`→`viewer` migration at startup
- [ ] **Step 12**: Re-seed database
- [ ] **Step 13**: Test the implementation
