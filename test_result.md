#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  EditVault is a Video Editor CRM built with React + Supabase (Auth + Postgres + RLS).
  - The user reported a bug: admin login does not work even though the user has role='admin' in profiles, while client login works.
  - Root cause we identified: in the previous Login.jsx the supabase response was destructured wrong (`prof?.data?.role` instead of `prof?.role`), so role was always falsely resolved as 'client' on the admin login screen and the user was signed out.
  - The user asked for a single Supabase Auth system (no separate admin auth), single login route that reads profiles.role and redirects (admin -> /admin, client -> /portal).
  - The user also asked for an expanded workflow (statuses: Pending, Editing, Internal Review, Editing Completed, Sent To Client, Client Review, Correction Requested, Re-Editing, Client Approved, Posted, Archived), a "Send To Client" gate, restricted client view to only Sent/Client Review/Correction/Approved/Posted, client can only edit status with limited options, Posted locks the row (admin can unlock), custom video types, correction form (title, description, priority, optional screenshot/voice note), activity log, notifications, month management (duplicate previous month, delete month).

frontend:
  - task: "Single Supabase Auth login that routes by role"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Login.jsx, /app/frontend/src/App.js, /app/frontend/src/context/AuthContext.jsx, /app/frontend/src/components/ProtectedRoute.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Rewrote login as a single page (/login). After signInWithPassword the page reads role from public.profiles by id and navigates to /admin or /portal. Removed all hardcoded admin email checks. /admin/login now redirects to /login. ProtectedRoute enforces required role.
  - task: "Role-aware routing and role-based UI (sidebar, layout, protected routes)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/App.js, /app/frontend/src/components/Sidebar.jsx, /app/frontend/src/components/Layout.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Sidebar shows different nav for admin (Dashboard / Clients / Client Portal) vs client (My Videos). Topbar includes NotificationsBell. ProtectedRoute requires role.
  - task: "Admin dashboard wired to Supabase (pending videos by status, monthly payments, activity log)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Dashboard.jsx, /app/frontend/src/components/ActivityLog.jsx, /app/frontend/src/lib/api.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Dashboard shows only pending statuses (Pending/Editing/Internal Review/Editing Completed) and Monthly Payment summary, plus the latest 10 activity log entries.
  - task: "Admin client detail (workflow: add/edit/delete videos, change status, Send To Client, Unlock Posted, custom types, duplicate/delete month)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/ClientDetail.jsx, /app/frontend/src/lib/api.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Admin can edit every field (name/duration/version/type/amount/due date/status). Send To Client button shown only when status is Editing Completed. Unlock button shown when posted_locked is true. Duplicate Previous Month + Delete Month are present. Custom video type creation is inline.
  - task: "Client portal (only see Sent/Client Review/Correction/Approved/Posted, status-only edits, Posted lock, correction form)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/ClientHome.jsx, /app/frontend/src/components/CorrectionForm.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          ClientHome groups videos into Waiting / Corrections / Approved / Posted, shows Invoices and Payment Status. The 4 actions (Client Review, Correction Requested, Client Approved, Posted) are exposed. Correction action opens a form with title/description/priority/screenshot/voice note that uploads to Supabase Storage bucket 'corrections'.
  - task: "Notifications + activity log (realtime via Supabase channel)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/NotificationsBell.jsx, /app/frontend/src/components/ActivityLog.jsx, /app/frontend/src/lib/api.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Bell shows unread count and live-updates via Supabase realtime channel filtered to recipient_id=auth.uid(). Notifications are produced by SQL triggers (status_changed, new invoice).
  - task: "Supabase schema, RLS, triggers (Posted lock, client-rule trigger, activity_log, notifications)"
    implemented: true
    working: "NA"
    file: "/app/supabase_schema.sql"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Idempotent migration. Adds new columns to videos (status, posted_locked, due_date, sent_at), migrates legacy editor_status/client_status data, drops legacy columns, creates corrections, activity_log, notifications, video_types. RLS enforces: clients see only client-visible statuses; only admin can do anything else; trigger blocks clients from editing non-status fields and enforces Posted lock.
metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Single Supabase Auth login that routes by role"
    - "Role-aware routing and role-based UI (sidebar, layout, protected routes)"
    - "Admin dashboard wired to Supabase (pending videos by status, monthly payments, activity log)"
    - "Admin client detail (workflow: add/edit/delete videos, change status, Send To Client, Unlock Posted, custom types, duplicate/delete month)"
    - "Client portal (only see Sent/Client Review/Correction/Approved/Posted, status-only edits, Posted lock, correction form)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      I fixed the admin login bug by removing the broken response-destructuring path and consolidating to a single /login page that:
        1. Calls supabase.auth.signInWithPassword(email,password)
        2. Reads public.profiles.role for the resulting user.id
        3. Navigates to /admin if role==='admin' otherwise /portal
      I also implemented the full video workflow, custom video types, correction form, activity log, notifications (realtime), month-duplication, and updated the SQL with proper RLS and triggers (file at /app/supabase_schema.sql).

      IMPORTANT for testing:
        - The user must run /app/supabase_schema.sql in the Supabase SQL Editor (the v2 schema). It is idempotent.
        - The user must create a Storage bucket named 'corrections' (public) for the correction file uploads to work.
        - The first admin user has to be created from the Supabase Dashboard and then `update public.profiles set role='admin' where id='<uuid>';`
        - Frontend env vars are configured (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY).
        - There is no FastAPI backend in this project. Supabase is the backend. Testing should be done at the UI/Supabase boundary using a freshly-created admin (test_admin@example.com) and a freshly-created client (test_client@example.com) whose email is added in the clients table by the admin.
      Please verify:
        1. Admin login successfully redirects to /admin (the previously reported bug).
        2. Client login successfully redirects to /portal.
        3. A client cannot see videos whose status is in {Pending, Editing, Internal Review, Editing Completed, Re-Editing, Archived} (RLS).
        4. After admin sets status to "Sent To Client" the client can see it.
        5. Posted videos are locked from client edits (admin can unlock).
        6. Notifications bell increments when status changes occur.
