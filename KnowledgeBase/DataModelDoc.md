# UniHousing — Data Model Documentation

## Tech Stack
- **Frontend:** Flutter
- **Backend:** Node.js + Express REST API
- **Database:** Supabase Postgres + Prisma ORM
- **Auth:** JWT (Google OAuth + email/password)
- **Chat:** REST polling (5-10s interval on active chat screen)
- **File Storage:** Local disk during dev (`/uploads`)
- **Admin:** API endpoints only (no UI)

---

## Schema Overview (10 domains, 16 tables)

| Domain               | Tables                                      |
|----------------------|---------------------------------------------|
| User & Auth          | User, StudentVerification, LandlordVerification |
| Property Listings    | Property, PropertyImage                     |
| Reviews & Ratings    | Review                                      |
| Chat & Messaging     | Chat, ChatParticipant, Message              |
| Visit Scheduling     | Visit                                       |
| Reporting            | Report                                      |
| Roommate Matching    | RoommateProfile, RoommateSwipe, RoommateMatch |
| Notifications        | Notification                                |
| Analytics            | AnalyticsEvent                              |

---

## VD Map Coverage — How Each Business Question Is Answered

### From User DB (AnalyticsEvent table)

| # | Business Question | Event Types Used | Query Strategy |
|---|-------------------|-----------------|----------------|
| 1 | How much time does a session take on average? | SESSION_START, SESSION_END | Group by sessionId, calculate duration from payload.durationSeconds, aggregate average by day/week/month |
| 2 | Which screen/process has the highest crash rate? | CRASH | Group by payload.screen, count frequency, rank by crash rate percentage |
| 3 | What apartment sizes do students search for most? | SEARCH | Extract payload.filters.sizeRange, count frequency per size category |
| 4 | What is the preferred max distance from university? | SEARCH, FILTER_APPLIED | Extract distance filter values, calculate distribution percentiles |
| 5 | How many users seek roommates in each neighborhood? | FEATURE_CLICK (roommate_finder) + RoommateProfile.preferredArea | Join analytics with roommate profiles, group by area |
| 6 | Which app features have lowest user engagement? | FEATURE_CLICK | Count per feature, calculate engagement rate per user, rank least to most |
| 7 | Loading times for top 3 features? | FEATURE_CLICK | Requires client-side timing in payload (responseTimeMs), average per feature |
| 8 | Which search filters are used most frequently? | FILTER_APPLIED | Count by payload.filterName, calculate usage percentages |
| 9 | Which neighborhoods have highest search volume? | SEARCH | Extract location/neighborhood from search payload, aggregate by area |
| 10 | In which months does peak housing search occur? | SEARCH, CHAT_STARTED | Group searches and chats by month, identify seasonal patterns |

### From User Interactions DB (Cross-table queries)

| # | Business Question | Tables Involved | Query Strategy |
|---|-------------------|----------------|----------------|
| 11 | Which feature shows greatest performance degradation? | AnalyticsEvent (FEATURE_CLICK with timing) | Compare response times across app versions in payload |
| 12 | Conversion rate: chat users vs non-chat users? | Chat, ChatParticipant, AnalyticsEvent | Count users with chats vs without, compare engagement metrics |

### DROPPED (require Transactions DB we don't have)
| # | Business Question | Reason Dropped |
|---|-------------------|---------------|
| 13 | Average rental price by neighborhood? | No transaction/lease records in system |
| 14 | Verified landlord impact on retention/rentals? | No transaction/lease records in system |

---

## Functional Scenario Coverage

| Scenario | Key Tables | Notes |
|----------|-----------|-------|
| 1. Filtering Properties | Property, AnalyticsEvent (SEARCH, FILTER_APPLIED) | Geospatial index on lat/lng for distance queries |
| 2. Landlord Verification | LandlordVerification | Status flow: PENDING → VERIFIED/REJECTED |
| 3. Roommate Matching | RoommateProfile, RoommateSwipe, RoommateMatch | Match created when mutual RIGHT swipes detected |
| 4. Property Review | Review, Chat (for eligibility check) | @@unique on [propertyId, authorId] prevents duplicates |
| 5. Report Suspicious Listing | Report, Property (status → HIDDEN) | Cascading: report auto-hides property |
| 6. Direct Messaging | Chat, ChatParticipant, Message | Student initiates; landlord cannot start chats |
| 7. Boosted Listings | DROPPED | No payment/transaction model |
| 8. Visit Scheduling | Message (VISIT_PROPOSAL), Visit | Visit record created only on acceptance |
| 9. User Login | User (authProvider, JWT generation) | Google OAuth + email/password |
| 10. Registration & Verification | User, StudentVerification, LandlordVerification | Separate flows per role |

---

## Visit Proposal Flow (Chat-Embedded)

### Message metadata schema for VISIT_PROPOSAL:
```json
{
  "proposedDates": [
    { "id": "slot_1", "date": "2026-03-25", "time": "14:00" },
    { "id": "slot_2", "date": "2026-03-26", "time": "10:00" },
    { "id": "slot_3", "date": "2026-03-27", "time": "16:00" }
  ],
  "message": "When works best for you to see the apartment?"
}
```

### Message metadata schema for VISIT_RESPONSE:
```json
{
  "proposalMessageId": "msg_xxx",
  "selectedSlotId": "slot_2",     // null if declining all
  "accepted": true
}
```

### Flow:
1. Landlord sends Message (type: VISIT_PROPOSAL) with proposed dates in metadata
2. Student sees poll-style card in chat UI
3. Student taps a date → sends Message (type: VISIT_RESPONSE) with selection
4. Backend creates Visit record with scheduledAt = selected slot datetime
5. System sends Notification (VISIT_CONFIRMED) to both parties
6. 24h before visit → Notification (VISIT_REMINDER)

---

## Review Eligibility Check

A student can only review a property if:
1. Student is verified (StudentVerification.status = VERIFIED)
2. Student has an existing chat with the property's landlord about that property
   (ChatParticipant where userId = student AND chat.propertyId = property)
3. Student has not already reviewed this property (@@unique constraint)

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single role per user (locked) | Simplifies auth, UI routing, and data model |
| Chat-based review eligibility | Lightweight proof of interaction without tracking leases |
| Generic analytics events table | Flexible JSON payload, no schema changes for new events |
| Visit as separate entity (not just chat) | Enables notification scheduling and analytics tracking |
| Denormalized landlordId on Review | Enables fast average rating queries without joins through Property |
| Soft-delete via status fields | Properties go HIDDEN/EXPIRED, never hard-deleted |
