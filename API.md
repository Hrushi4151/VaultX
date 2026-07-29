# VaultX REST API Documentation

The VaultX API is designed following RESTful principles, consuming and producing `application/json`.
Base Path: `/api/v1`

## Authentication

VaultX uses stateless JWT authentication.
To access protected endpoints, you must include the token in the HTTP Headers:
```http
Authorization: Bearer <your_jwt_token>
```

## Standard Response Format

Every API endpoint, whether successful or an error, returns a unified `ApiResponse` wrapper.

**Success (200 OK)**
```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "timestamp": "2026-07-24T12:00:00",
  "data": { ... }
}
```

**Error (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_FAILED",
  "timestamp": "2026-07-24T12:00:00",
  "errors": {
    "email": "Must be a valid email address"
  }
}
```

## Key Endpoints

### Auth
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate and receive JWT
- `GET /auth/me` - Get current user profile

### Documents
- `POST /documents/upload` - Upload a multipart file (requires `multipart/form-data`)
- `GET /documents` - List user documents (supports pagination)
- `GET /documents/{id}/download` - Download binary file stream
- `DELETE /documents/{id}/trash` - Soft delete a document

### Smart Search
- `GET /search?query={term}` - Semantic and full-text search across document names, descriptions, and OCR text.

### Secure Sharing
- `POST /shares` - Create a public, time-expiring share link.
- `GET /public/shares/{token}` - Unauthenticated endpoint to retrieve shared content (if no PIN is required).

### Enterprise Admin
*Requires `ROLE_ADMIN` or `ROLE_SUPER_ADMIN`*
- `GET /admin/analytics/dashboard` - Global metrics
- `GET /admin/users` - List all users
- `POST /admin/users/{id}/suspend` - Suspend an account
