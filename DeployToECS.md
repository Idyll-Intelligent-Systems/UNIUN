# Docker Tag & Push to ECR (Backend and Frontend)

Registry: 791704693413.dkr.ecr.ap-southeast-1.amazonaws.com/un1un1

1. Authenticate to ECR

```sh
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 791704693413.dkr.ecr.ap-southeast-1.amazonaws.com
```

2. Build images

```sh
# Backend
docker build -t un1un1-backend:latest ./backend

# Frontend
docker build -t un1un1-frontend:latest ./frontend
```

3. Tag images for ECR

```sh
docker tag un1un1-backend:latest 791704693413.dkr.ecr.ap-southeast-1.amazonaws.com/un1un1:backend-latest
docker tag un1un1-frontend:latest 791704693413.dkr.ecr.ap-southeast-1.amazonaws.com/un1un1:frontend-latest
```

4. Push to ECR

```sh
docker push 791704693413.dkr.ecr.ap-southeast-1.amazonaws.com/un1un1:backend-latest
docker push 791704693413.dkr.ecr.ap-southeast-1.amazonaws.com/un1un1:frontend-latest
```

5. ECS Deployment

- Update your ECS Task Definitions to reference the new image tags (:backend-latest and :frontend-latest) and set required env vars:
    - Backend: PORT=4000, JWT_SECRET, MONGO_URI, NEO4J_URI/USER/PASSWORD, NEXT_PUBLIC_API_URL for the frontend if needed via service discovery, GOOGLE_CLIENT_ID (optional), AWS_S3_BUCKET/AWS_S3_CDN (optional)
    - Frontend: NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_DOMAIN_OR_ALB, NEXT_PUBLIC_GOOGLE_CLIENT_ID if using Google sign-in
- Update the ECS Services to use the new Task Definitions.
- Wait until services report steady state and verify /health on backend and main page on frontend.

Notes:

- Backend image exposes 4000 and serves /uploads and /avatars. Persist media by mounting a volume or pointing uploads to S3 via /api/media/upload-url.
- Frontend expects NEXT_PUBLIC_API_URL to talk to backend. Ensure security groups allow HTTP/HTTPS.
