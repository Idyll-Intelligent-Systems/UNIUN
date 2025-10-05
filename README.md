# UNIUN
Easy Content Monetization App for Creators, SAAS
 
# Application Requirements:

## Menus and their corresponding contents:
    Home --> Feed with users interests or cosine similarity, Following Users feed, and Search users or content with cosine similarity list and input field for search.
    Shop --> ECommerce for content,Linking Users posts for Selling content, Buying posts.
    Trending --> Trending feeds of all creators/users
    Add/Upload --> (+) symbol to right of the screen to upload content for the user
    Messages --> Chat, Voice calls and Video calls for connecting with other users
    Profile --> Bio, Posts, Replies, Media and ETC of that user
    Tools --> Logout and system settings for the app, specific to user
    UNIUN --> Creator space for conference calls, with video, chat and screen share.

## Make a flexible application, should be adapted according to screen size, Both a Mobile and Website application:
    Landing page --> Home
    Home --> Feed, Following users feed, Search other user and their content (Top nav select for submenus)
    Side Nav Bar Menus --> Home, Shop, Trending, Messages, Profile, Tools, UNIUN
    Bottom Nav Bar --> Home, Shop, Add/Upload, Messages, Profile
    Colors --> Dark theme with colors Galaxy Black, Gold, Burgundy, Tangerine, and Olive Green.
    Content cards --> Should include media (image, video, or audio) text at the bottom, likes, replies, reposts, bookmark, views, shop link for the user, add to cart symbol, wishlist symbol, each post card should take 100% width, and page should contain at max 3 posts, vertical height should be fixed for clean and neat content visuals
    Shop cards --> Price, media, user, buy for other user, sell for the logged in user, Add to cart, Wishlist
    Trending --> Trending Feed metrics should be likes, reposts, and views
    Tools --> Logout, and other system settings like enable notifications, vibrations, silent, mic, video, gallery, location, and more.
    Messages --> Whatsapp like messaging with other users in the platform.
    Profile --> User feed at one place, posts, media, replies, reposts, profile edit, cart, wishlists, more, similar to X and Instagram
    UNIUN --> Conference calls interface like X spaces and  gmeet with other users in the platform.

## UI Library:
    USE SHADCN for UI Refer [SHAD CN DOCS](https://ui.shadcn.com/docs)
    UI SHOULD be modern, minimalistic, futuristic and clean with only SHADCN components
    UI and UX should look similar to https://x.com/ with colors black, gold and red as the theme colors of the site. The site should premium and end to end interactale with modern experience.

## Tech stack:
    Backend: NodeJs 
    Frontend: NextJs with Typescript and ReactJs with Shadcn Material UI
    DB: Neo4J, VectorDB, MongoDB
    Monitoring: Graphana, Prometheus

## Installation & Setup
        Quickstart (local, development):

        Prerequisites:
        - Docker & Docker Compose v2
        - Node.js 18+ (for local dev if not using Docker)

        1) Build and run with Docker Compose (recommended):

             Open a terminal at the repo root and run:

             ```bash
             docker compose build
             docker compose up
             ```

             This will build the frontend and backend images and start supporting services:
             - frontend: Next.js app on http://localhost:3000
             - backend: Node API on http://localhost:4000
             - neo4j: Graph DB (bolt on 7687, HTTP on 7474)
             - mongo: MongoDB (27017)
             - milvus: Vector DB for embeddings (stand-in for VectorDB)
             - prometheus: Monitoring on 9090
             - grafana: Dashboard on 3001

        2) Local development (without Docker):

             - Frontend:

                 cd frontend
                 npm install
                 npm run dev

             - Backend:

                 cd backend
                 npm install
                 npm run dev

        Configuration:
        - Environment variables are read from `.env` in each service directory (not checked in). Example env keys:
            - BACKEND_PORT, MONGO_URI, NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

        Notes & next steps:
        - The scaffold provides a minimal, enterprise-friendly structure and health endpoints. It does not implement full product features (shadcn UI components, authentication, payments, media storage). Those are next steps.
        - See `docker-compose.yml` for service ports and credentials.
## Containerization & Deployment
    A `Dockerfile` is provided for both `frontend` and `backend`. Use the included `docker-compose.yml` for local orchestration. For production, adapt Dockerfiles to your cloud provider's build pipeline and replace development settings (for example, use a managed vector DB and managed Neo4j or cloud-hosted databases).
## Testing
    The scaffold includes basic health endpoints and a tiny test harness can be added with Jest/Playwright for unit and E2E tests. Add CI steps (GitHub Actions) to run lint, unit tests, and build.
## Monitoring
    Prometheus and Grafana are included in `docker-compose.yml`. The backend exposes a `/health` endpoint; instrument further metrics (Prometheus client) and add dashboards in Grafana.
## Future Scope
    Add Audio Content Page

## Copilot Instructions
Write end to end enterprise grade, clean, reusable, expandable, fully scalable code for this application using the requirements and techstack mentioned above.

## E2E & WebRTC notes

- Playwright E2E tests are scaffolded under `frontend/e2e`. To run them locally:

```bash
# from repo root
pnpm install
cd frontend
pnpm -s e2e:install   # installs Playwright browsers
pnpm -s e2e           # runs the tests against localhost:3000
```

- The WebRTC demo (`/uniun`) supports configuring STUN/TURN servers via env vars:
    - `NEXT_PUBLIC_STUN` (defaults to `stun:stun.l.google.com:19302`)
    - `NEXT_PUBLIC_TURN` (optional, e.g. `turn:turn.example.com:3478`)

When running in CI, the GitHub Actions workflow `./github/workflows/e2e.yml` will start the Docker Compose stack and run Playwright tests.