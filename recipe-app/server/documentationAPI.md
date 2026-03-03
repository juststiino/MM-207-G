# API

This project exposes a small REST API used by the client application. The API is split into authentication, users and recipes to keep responsibilities separated.

URL: http://localhost:3000
---

## Authentication 
### Register
POST /api/auth/register

Registers a new user. Requires username, password and confirmation that the user has accepted the Terms of Service. If the input is valid and the username does not already exist, the user is created.

Possible responses:
- 201 Created
- 400 Bad Request
- 409 Conflict

### Login
POST /api/auth/login

Logs in a user and returns an authentication token. The token must be sent in the authorization header for protected routes.

Possible responses:
- 200 OK
- 401 Unauthorized
---

## Users
### Delete account
DELETE /api/users/me

Deletes the currently authenticated user. This is also how a user withdraws consent. All personal data is removed.

Requires: Authorization: Bearer token

Possible responses:
- 204 No Content
- 401 Unauthorized
---

## Recipes
### Create recipe
POST /api/recipes

Creates a recipe for the logged in user. Recipe input is validated server-side.

Requires: Authorization: Bearer token

### Get public recipes
GET /api/recipes/public

Returns all public recipes.

### Delete recipe
DELETE /api/recipes/:id

Deletes a recipe owned by the logged in user.

Requires:Authorization: Bearer token