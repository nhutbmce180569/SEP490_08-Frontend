# StayHub Web Context

## Project

StayHub Web Frontend

## Stack

- React
- TypeScript
- Vite
- TailwindCSS
- React Router
- Axios

Backend:

- .NET Microservices
- API Gateway (YARP)

## Existing Architecture

src/
├─ features/
├─ services/
├─ hooks/
├─ components/
├─ pages/
├─ types/

Rules:

- Reuse existing hooks.
- Reuse existing services.
- Reuse existing types.
- Do not introduce Redux.
- Do not introduce Zustand.
- Do not rename files.
- Do not move files.
- Only modify requested files.
- Preserve current coding style.

## API Access

All requests go through Gateway.

Gateway Base URL:
https://localhost:5000

Social APIs:

GET /api/moments
POST /api/moments
POST /api/moments/{id}/reactions
POST /api/moments/{id}/comments
PUT /api/moments/comments/{id}
DELETE /api/moments/comments/{id}
DELETE /api/moments/{id}

POST /api/locations/ping
GET /api/locations/schedules/{scheduleId}/live

Authentication:
Bearer JWT
