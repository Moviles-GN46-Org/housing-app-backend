# UniHousing — Solution Architecture Document

## 1. System Overview

UniHousing is a mobile application for university students to find verified housing and compatible roommates. The system follows a client-server architecture with a Flutter mobile client communicating with a Node.js REST API backed by PostgreSQL.

```
┌─────────────────────────────────────────────────────────┐
│                    FLUTTER CLIENT                        │
│                                                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│   │  Views    │  │ ViewModels│  │  Models  │             │
│   │ (Widgets) │◄─┤(Providers)│◄─┤  (DTOs)  │             │
│   └──────────┘  └────┬─────┘  └──────────┘             │
│                      │                                   │
│              ┌───────┴───────┐                           │
│              │  Repositories  │ (HTTP client layer)      │
│              └───────┬───────┘                           │
│                      │ REST (JSON over HTTPS)            │
└──────────────────────┼──────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────┐
│               NODE.JS + EXPRESS API                      │
│                      │                                   │
│              ┌───────┴───────┐                           │
│              │   Controllers  │ (Route handlers)         │
│              └───────┬───────┘                           │
│                      │                                   │
│              ┌───────┴───────┐                           │
│              │   Services     │ (Business logic)         │
│              │  ┌───────────┐│                           │
│              │  │ Strategies ││ (Matching, Filtering)    │
│              │  └───────────┘│                           │
│              └───────┬───────┘                           │
│                      │                                   │
│     ┌────────────────┼────────────────┐                  │
│     │                │                │                  │
│  ┌──┴───┐    ┌───────┴───────┐  ┌────┴─────┐           │
│  │ DTOs │    │  Repositories  │  │  Event   │           │
│  │      │    │  (Prisma wrap) │  │  Emitter │           │
│  └──────┘    └───────┬───────┘  │ (Observer)│           │
│                      │          └────┬─────┘           │
│                      │               │                  │
│              ┌───────┴───────┐  ┌────┴─────┐           │
│              │    Prisma ORM  │  │Notification│          │
│              └───────┬───────┘  │Analytics  │           │
│                      │          │Listeners  │           │
│                      │          └──────────┘           │
└──────────────────────┼──────────────────────────────────┘
                       │
              ┌────────┴────────┐
              │   Supabase      │
              │   PostgreSQL    │
              └─────────────────┘
```

---

## 2. Architecture Patterns

### 2.1 MVC — Backend (Node.js + Express)

The backend follows Model-View-Controller, where Flutter acts as the external View.

| Component   | Implementation                        | Responsibility                              |
|-------------|---------------------------------------|---------------------------------------------|
| **Model**   | Prisma schema + Repository layer      | Data structure, persistence, validation     |
| **View**    | JSON responses (consumed by Flutter)  | Data presentation format                    |
| **Controller** | Express route handlers (`/controllers`) | Receives HTTP requests, delegates to services, returns responses |

**Directory structure:**
```
src/
├── controllers/        # Route handlers (Controller)
│   ├── authController.js
│   ├── propertyController.js
│   ├── chatController.js
│   ├── reviewController.js
│   ├── roommateController.js
│   ├── reportController.js
│   ├── visitController.js
│   ├── notificationController.js
│   └── analyticsController.js
├── services/           # Business logic
│   ├── authService.js
│   ├── propertyService.js
│   ├── chatService.js
│   ├── reviewService.js
│   ├── roommateService.js
│   ├── reportService.js
│   ├── visitService.js
│   ├── notificationService.js
│   └── analyticsService.js
├── repositories/       # Data access (Repository pattern)
│   ├── userRepository.js
│   ├── propertyRepository.js
│   ├── chatRepository.js
│   ├── reviewRepository.js
│   ├── roommateRepository.js
│   ├── reportRepository.js
│   ├── visitRepository.js
│   ├── notificationRepository.js
│   └── analyticsRepository.js
├── dtos/               # Request/Response shaping (DTO pattern)
│   ├── auth.dto.js
│   ├── property.dto.js
│   ├── chat.dto.js
│   ├── review.dto.js
│   ├── roommate.dto.js
│   └── user.dto.js
├── strategies/         # Strategy pattern implementations
│   ├── matching/
│   │   ├── matchingStrategy.js        # Interface
│   │   ├── compatibilityMatching.js   # Default implementation
│   │   └── proximityMatching.js       # Alternative
│   └── filtering/
│       ├── filterStrategy.js          # Interface
│       ├── distanceFilter.js          # Haversine calculation
│       └── budgetFilter.js
├── events/             # Observer pattern
│   ├── eventEmitter.js               # Central event bus
│   └── listeners/
│       ├── notificationListener.js
│       └── analyticsListener.js
├── middleware/         # Express middleware
│   ├── auth.js                       # JWT verification
│   ├── roleGuard.js                  # Role-based access
│   └── validation.js                 # Request validation
├── routes/            # Route definitions
│   ├── index.js
│   ├── authRoutes.js
│   ├── propertyRoutes.js
│   ├── chatRoutes.js
│   ├── reviewRoutes.js
│   ├── roommateRoutes.js
│   ├── reportRoutes.js
│   ├── visitRoutes.js
│   ├── notificationRoutes.js
│   └── analyticsRoutes.js
├── utils/
│   ├── haversine.js                  # Distance calculation
│   ├── jwt.js                        # Token generation/verification
│   └── errors.js                     # Custom error classes
├── prisma/
│   └── schema.prisma
├── app.js              # Express app setup
└── server.js           # Entry point
```

### 2.2 MVVM — Frontend (Flutter)

Flutter follows Model-View-ViewModel using Provider for state management.

| Component    | Implementation                        | Responsibility                              |
|--------------|---------------------------------------|---------------------------------------------|
| **Model**    | Dart classes in `/models`             | Data structures matching API DTOs           |
| **View**     | Flutter Widgets in `/views`           | UI rendering, user interaction              |
| **ViewModel**| ChangeNotifier classes in `/viewmodels`| State management, business logic, API calls |

**Flow:** View listens to ViewModel → ViewModel calls Repository → Repository calls API → Response parsed into Model → ViewModel updates → View rebuilds.

```
lib/
├── models/              # Data classes (Model)
│   ├── user.dart
│   ├── property.dart
│   ├── chat.dart
│   ├── message.dart
│   ├── review.dart
│   ├── roommate_profile.dart
│   ├── visit.dart
│   └── notification.dart
├── views/               # Widgets/Screens (View)
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── register_screen.dart
│   │   └── verify_email_screen.dart
│   ├── home/
│   │   ├── student_home_screen.dart
│   │   └── landlord_home_screen.dart
│   ├── property/
│   │   ├── property_list_screen.dart
│   │   ├── property_map_screen.dart
│   │   ├── property_detail_screen.dart
│   │   └── property_form_screen.dart     # Landlord: create/edit
│   ├── chat/
│   │   ├── chat_list_screen.dart
│   │   └── chat_detail_screen.dart       # Messages + visit proposals
│   ├── roommate/
│   │   ├── roommate_profile_setup.dart
│   │   ├── roommate_swipe_screen.dart
│   │   └── roommate_matches_screen.dart
│   ├── reviews/
│   │   └── review_form_screen.dart
│   └── notifications/
│       └── notifications_screen.dart
├── viewmodels/          # State + Logic (ViewModel)
│   ├── auth_viewmodel.dart
│   ├── property_viewmodel.dart
│   ├── chat_viewmodel.dart
│   ├── roommate_viewmodel.dart
│   ├── review_viewmodel.dart
│   ├── notification_viewmodel.dart
│   └── visit_viewmodel.dart
├── repositories/        # API communication (Repository pattern)
│   ├── auth_repository.dart
│   ├── property_repository.dart
│   ├── chat_repository.dart
│   ├── roommate_repository.dart
│   ├── review_repository.dart
│   ├── notification_repository.dart
│   └── analytics_repository.dart
├── services/            # Shared utilities
│   ├── api_client.dart              # Base HTTP client with JWT
│   ├── storage_service.dart         # Local token storage
│   └── location_service.dart        # GPS for distance filters
├── widgets/             # Reusable components
│   ├── property_card.dart
│   ├── filter_bar.dart
│   ├── review_stars.dart
│   ├── visit_proposal_card.dart
│   ├── roommate_swipe_card.dart
│   └── message_bubble.dart
├── routes/
│   └── app_router.dart              # Navigation configuration
└── main.dart
```

### 2.3 Repository Pattern — Data Access Abstraction

The Repository pattern wraps Prisma (backend) and HTTP calls (frontend) behind a clean interface, decoupling business logic from data access.

**Backend example (propertyRepository.js):**
```javascript
// Repository abstracts Prisma queries behind domain-specific methods
class PropertyRepository {
  async findByFilters({ maxPrice, petFriendly, minSize, lat, lng, radiusKm }) {
    return prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        monthlyRent: maxPrice ? { lte: maxPrice } : undefined,
        petFriendly: petFriendly || undefined,
        sizeM2: minSize ? { gte: minSize } : undefined,
      },
      orderBy: { publishedAt: 'desc' },
    });
    // Distance filtering applied in service layer via Haversine
  }

  async findById(id) { ... }
  async create(data) { ... }
  async updateStatus(id, status) { ... }
}
```

**Frontend example (property_repository.dart):**
```dart
class PropertyRepository {
  final ApiClient _api;
  
  Future<List<Property>> searchProperties(PropertyFilter filters) async {
    final response = await _api.get('/properties', queryParams: filters.toMap());
    return (response.data as List).map((p) => Property.fromJson(p)).toList();
  }

  Future<Property> getPropertyDetail(String id) async {
    final response = await _api.get('/properties/$id');
    return Property.fromJson(response.data);
  }
}
```

### 2.4 DTO Pattern — Request/Response Shaping

DTOs ensure internal database models are never exposed directly to the client. They strip sensitive fields, flatten nested data, and enforce a stable API contract.

**Example: User DTO**
```javascript
// NEVER send this to client:
// { id, email, passwordHash, role, ... }

// Instead, transform through DTO:
class UserResponseDTO {
  static fromModel(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePictureUrl: user.profilePictureUrl,
      isVerified: user.role === 'STUDENT'
        ? user.studentVerification?.status === 'VERIFIED'
        : user.landlordVerification?.status === 'VERIFIED',
      createdAt: user.createdAt,
    };
    // passwordHash, authProvider internals, etc. are EXCLUDED
  }
}

class PropertyResponseDTO {
  static fromModel(property) {
    return {
      id: property.id,
      title: property.title,
      description: property.description,
      monthlyRent: Number(property.monthlyRent),
      address: property.address,
      neighborhood: property.neighborhood,
      latitude: property.latitude,
      longitude: property.longitude,
      imageUrls: property.imageUrls,
      petFriendly: property.petFriendly,
      furnished: property.furnished,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sizeM2: property.sizeM2,
      landlord: {
        id: property.landlord.id,
        firstName: property.landlord.firstName,
        isVerified: property.landlord.landlordVerification?.status === 'VERIFIED',
      },
      averageRating: property._avgRating || null,
      reviewCount: property._reviewCount || 0,
      status: property.status,
      publishedAt: property.publishedAt,
    };
  }
}
```

### 2.5 Strategy Pattern — Roommate Matching & Search Filtering

The Strategy pattern encapsulates interchangeable algorithms behind a common interface, allowing different matching/filtering behaviors without modifying the service.

**Roommate Matching Strategies:**
```javascript
// Interface (base strategy)
class MatchingStrategy {
  score(profileA, profileB) {
    throw new Error('score() must be implemented');
  }
}

// Strategy 1: Compatibility-based (default)
// Scores based on lifestyle attribute similarity
class CompatibilityMatching extends MatchingStrategy {
  score(profileA, profileB) {
    let score = 0;
    if (profileA.sleepSchedule === profileB.sleepSchedule) score += 30;
    if (profileA.cleanlinessLevel === profileB.cleanlinessLevel) score += 25;
    if (profileA.noisePreference === profileB.noisePreference) score += 20;
    if (profileA.smokes === profileB.smokes) score += 15;
    // Budget overlap check
    const budgetOverlap = Math.min(profileA.budgetMax, profileB.budgetMax)
                        - Math.max(profileA.budgetMin, profileB.budgetMin);
    if (budgetOverlap > 0) score += 10;
    return score; // 0-100
  }
}

// Strategy 2: Proximity-based
// Prioritizes users who prefer the same neighborhood
class ProximityMatching extends MatchingStrategy {
  score(profileA, profileB) {
    let score = 0;
    if (profileA.preferredArea === profileB.preferredArea) score += 50;
    // ... rest of compatibility factors weighted differently
    return score;
  }
}

// Used in service:
class RoommateService {
  constructor(strategy = new CompatibilityMatching()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async getCandidates(userId) {
    const myProfile = await roommateRepo.getProfile(userId);
    const allProfiles = await roommateRepo.getActiveProfiles(userId);
    
    return allProfiles
      .map(profile => ({
        ...profile,
        compatibilityScore: this.strategy.score(myProfile, profile),
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
}
```

### 2.6 Observer Pattern — Event-Driven Side Effects

The Observer pattern decouples core business actions from their side effects (notifications, analytics logging). When something happens, the service emits an event; listeners react independently.

```javascript
// events/eventEmitter.js
const EventEmitter = require('events');
const appEvents = new EventEmitter();
module.exports = appEvents;

// Events catalog:
// 'visit:confirmed'     → { visit, student, landlord, property }
// 'roommate:matched'    → { user1, user2, matchId }
// 'review:submitted'    → { review, property, author }
// 'report:created'      → { report, reporter, property }
// 'message:sent'        → { message, chat, sender }
// 'listing:expiring'    → { property, landlord }

// events/listeners/notificationListener.js
const appEvents = require('../eventEmitter');
const notificationService = require('../../services/notificationService');

appEvents.on('visit:confirmed', async ({ visit, student, landlord }) => {
  await notificationService.create({
    userId: student.id,
    type: 'VISIT_CONFIRMED',
    title: 'Visit Confirmed',
    body: `Your visit is scheduled for ${visit.scheduledAt}`,
    data: { visitId: visit.id, propertyId: visit.propertyId },
  });
  await notificationService.create({
    userId: landlord.id,
    type: 'VISIT_CONFIRMED',
    title: 'Visit Confirmed',
    body: `A student will visit on ${visit.scheduledAt}`,
    data: { visitId: visit.id, propertyId: visit.propertyId },
  });
});

appEvents.on('roommate:matched', async ({ user1, user2, matchId }) => {
  // Notify both users
  // Create chat between them
  // Log analytics event
});

// events/listeners/analyticsListener.js
appEvents.on('visit:confirmed', async ({ visit }) => {
  await analyticsRepo.logEvent({
    userId: visit.studentId,
    sessionId: 'server',
    eventType: 'VISIT_SCHEDULED',
    payload: { propertyId: visit.propertyId, chatId: visit.chatId },
  });
});

// Registration in app.js:
require('./events/listeners/notificationListener');
require('./events/listeners/analyticsListener');
// Listeners self-register on import
```

**Usage in service (clean, decoupled):**
```javascript
// visitService.js
const appEvents = require('../events/eventEmitter');

async acceptVisitProposal(chatId, messageId, selectedSlotId, studentId) {
  // 1. Business logic: create visit record
  const visit = await visitRepo.create({ ... });
  
  // 2. Emit event — side effects handled elsewhere
  appEvents.emit('visit:confirmed', {
    visit,
    student: await userRepo.findById(studentId),
    landlord: await userRepo.findById(visit.landlordId),
    property: await propertyRepo.findById(visit.propertyId),
  });
  
  return visit;
}
```

---

## 3. API Endpoint Inventory

### 3.1 Auth
| Method | Endpoint                       | Role       | Description                          |
|--------|--------------------------------|------------|--------------------------------------|
| POST   | `/api/auth/register`           | Public     | Create account (student or landlord) |
| POST   | `/api/auth/login`              | Public     | Email/password login → JWT           |
| POST   | `/api/auth/google`             | Public     | Google OAuth login → JWT             |
| POST   | `/api/auth/verify-email`       | Student    | Submit university email verification code |
| POST   | `/api/auth/resend-code`        | Student    | Resend verification code             |
| POST   | `/api/auth/refresh`            | Auth       | Refresh access token                 |
| GET    | `/api/auth/me`                 | Auth       | Get current user profile             |

### 3.2 Properties
| Method | Endpoint                       | Role       | Description                          |
|--------|--------------------------------|------------|--------------------------------------|
| GET    | `/api/properties`              | Auth       | Search/filter properties             |
| GET    | `/api/properties/:id`          | Auth       | Property detail with reviews         |
| POST   | `/api/properties`              | Landlord   | Create new listing                   |
| PUT    | `/api/properties/:id`          | Landlord   | Update own listing                   |
| PATCH  | `/api/properties/:id/status`   | Landlord   | Mark as rented/active                |
| DELETE | `/api/properties/:id`          | Landlord   | Soft-delete (set status HIDDEN)      |

**Query params for GET /api/properties:**
```
?maxPrice=800000
&petFriendly=true
&minBedrooms=2
&furnished=true
&neighborhood=Chapinero
&lat=4.6351
&lng=-74.0703
&radiusKm=3
&sortBy=price|distance|recent
&page=1
&limit=20
```

### 3.3 Reviews
| Method | Endpoint                            | Role     | Description                          |
|--------|-------------------------------------|----------|--------------------------------------|
| GET    | `/api/properties/:id/reviews`       | Auth     | List reviews for a property          |
| POST   | `/api/properties/:id/reviews`       | Student  | Submit review (chat-based eligibility check) |

### 3.4 Chat & Messaging
| Method | Endpoint                            | Role       | Description                          |
|--------|-------------------------------------|------------|--------------------------------------|
| GET    | `/api/chats`                        | Auth       | List user's chats                    |
| POST   | `/api/chats`                        | Student    | Start chat with landlord about property |
| GET    | `/api/chats/:id/messages`           | Auth       | Get messages (supports `?after=timestamp` for polling) |
| POST   | `/api/chats/:id/messages`           | Auth       | Send text message                    |
| POST   | `/api/chats/:id/visit-proposal`     | Landlord   | Send visit date proposal (poll-style)|
| POST   | `/api/chats/:id/visit-response`     | Student    | Accept/decline visit proposal        |

### 3.5 Visits
| Method | Endpoint                       | Role       | Description                          |
|--------|--------------------------------|------------|--------------------------------------|
| GET    | `/api/visits`                  | Auth       | List user's confirmed visits         |
| PATCH  | `/api/visits/:id/status`       | Auth       | Cancel visit                         |

### 3.6 Roommate Matching
| Method | Endpoint                       | Role       | Description                          |
|--------|--------------------------------|------------|--------------------------------------|
| GET    | `/api/roommate/profile`        | Student    | Get own roommate profile             |
| POST   | `/api/roommate/profile`        | Student    | Create/update roommate profile       |
| GET    | `/api/roommate/candidates`     | Student    | Get ranked candidate list            |
| POST   | `/api/roommate/swipe`          | Student    | Swipe right/left on candidate        |
| GET    | `/api/roommate/matches`        | Student    | List matches                         |

### 3.7 Reports
| Method | Endpoint                       | Role       | Description                          |
|--------|--------------------------------|------------|--------------------------------------|
| POST   | `/api/reports`                 | Auth       | Submit report on listing/user        |

### 3.8 Notifications
| Method | Endpoint                       | Role       | Description                          |
|--------|--------------------------------|------------|--------------------------------------|
| GET    | `/api/notifications`           | Auth       | List user's notifications            |
| PATCH  | `/api/notifications/:id/read`  | Auth       | Mark notification as read            |
| PATCH  | `/api/notifications/read-all`  | Auth       | Mark all as read                     |

### 3.9 Admin
| Method | Endpoint                                   | Role  | Description                          |
|--------|--------------------------------------------|-------|--------------------------------------|
| GET    | `/api/admin/verifications/pending`         | Admin | List pending landlord verifications  |
| PATCH  | `/api/admin/verifications/:id`             | Admin | Approve/reject verification          |
| GET    | `/api/admin/reports/pending`               | Admin | List pending reports                 |
| PATCH  | `/api/admin/reports/:id`                   | Admin | Resolve report                       |
| PATCH  | `/api/admin/properties/:id/hide`           | Admin | Force-hide a listing                 |
| PATCH  | `/api/admin/users/:id/deactivate`          | Admin | Deactivate user account              |

### 3.10 Analytics
| Method | Endpoint                       | Role       | Description                          |
|--------|--------------------------------|------------|--------------------------------------|
| POST   | `/api/analytics/events`        | Auth       | Log client-side analytics event      |
| POST   | `/api/analytics/events/batch`  | Auth       | Log multiple events in one request   |
| GET    | `/api/analytics/dashboard`     | Admin      | Aggregated analytics (VD map queries)|

---

## 4. Authentication & Authorization Flow

### JWT Token Structure
```
Access Token (short-lived, 15 min):
{
  userId: "uuid",
  role: "STUDENT" | "LANDLORD" | "ADMIN",
  isVerified: true/false,
  iat: timestamp,
  exp: timestamp
}

Refresh Token (long-lived, 7 days):
{
  userId: "uuid",
  type: "refresh",
  iat: timestamp,
  exp: timestamp
}
```

### Middleware Chain
```
Request → auth.js (verify JWT) → roleGuard.js (check role) → Controller
```

### Role-Based Access Matrix
| Action                    | Public | Student (unverified) | Student (verified) | Landlord (pending) | Landlord (verified) | Admin |
|---------------------------|--------|----------------------|--------------------|---------------------|----------------------|-------|
| Browse properties         | ✗      | ✓                    | ✓                  | ✓                   | ✓                    | ✓     |
| View property detail      | ✗      | ✓                    | ✓                  | ✓                   | ✓                    | ✓     |
| Start chat                | ✗      | ✗                    | ✓                  | ✗                   | ✗                    | ✗     |
| Send message              | ✗      | ✗                    | ✓                  | ✗                   | ✓                    | ✗     |
| Submit review             | ✗      | ✗                    | ✓                  | ✗                   | ✗                    | ✗     |
| Create property listing   | ✗      | ✗                    | ✗                  | ✗                   | ✓                    | ✗     |
| Propose visit             | ✗      | ✗                    | ✗                  | ✗                   | ✓                    | ✗     |
| Use roommate finder       | ✗      | ✗                    | ✓                  | ✗                   | ✗                    | ✗     |
| Report listing            | ✗      | ✗                    | ✓                  | ✗                   | ✓                    | ✗     |
| Admin actions             | ✗      | ✗                    | ✗                  | ✗                   | ✗                    | ✓     |

---

## 5. Chat Polling Strategy

Since chat uses REST polling (no WebSockets):

**Client-side behavior:**
- When chat list screen is open: poll `GET /api/chats` every 15 seconds
- When inside a chat: poll `GET /api/chats/:id/messages?after={lastMessageTimestamp}` every 5 seconds
- When app is in background: no polling (save battery/data)
- On screen focus: immediate fetch before resuming interval

**Server-side optimization:**
- The `?after=timestamp` parameter ensures only new messages are returned
- Index on `(chatId, createdAt)` makes this query fast
- Response includes `hasMore: boolean` for pagination of history

---

## 6. Key Design Decisions Summary

| Decision                                  | Pattern Used     | Rationale                                                  |
|-------------------------------------------|------------------|------------------------------------------------------------|
| Backend structured as Controller→Service→Repository | MVC + Repository | Clean separation, testable layers                          |
| Flutter uses Provider + ChangeNotifier     | MVVM             | Standard Flutter state management, reactive UI             |
| API never exposes raw DB models            | DTO              | Security (no passwordHash leak), stable API contract       |
| Roommate matching via interchangeable algorithms | Strategy   | Extensible, easy to A/B test different approaches          |
| Side effects emitted as events             | Observer         | Decoupled notification + analytics from business logic     |
| Prisma wrapped in repository modules       | Repository       | Abstracts data source, easier to test with mocks           |
