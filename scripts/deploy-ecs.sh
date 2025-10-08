#!/usr/bin/env bash
set -euo pipefail

# Minimal ECS deploy helper for UNIUN. Requires AWS CLI v2, Docker, and jq.
# This script will NOT read AWS creds from repo. Ensure AWS_PROFILE or env vars are configured securely.

ACCOUNT_ID="791704693413"
AWS_REGION="ap-southeast-1"
ECR_REPO="un1un1"
CLUSTER_ARN="arn:aws:ecs:ap-southeast-1:791704693413:cluster/Un1un1Cluster"
BACKEND_TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:ap-southeast-1:791704693413:targetgroup/un1un1ExternalALBTG/dee0186f8f5e0068"
# FRONTEND_TARGET_GROUP_ARN should point to a separate target group (port 3000) with listener rules on the same ALB.
FRONTEND_TARGET_GROUP_ARN=${FRONTEND_TARGET_GROUP_ARN:-""}

# REQUIRED: set these before running (copy your actual values)
SUBNET_ID_1=${SUBNET_ID_1:-"subnet-xxxxxxxx"}
SUBNET_ID_2=${SUBNET_ID_2:-"subnet-yyyyyyyy"}
SECURITY_GROUP_ID=${SECURITY_GROUP_ID:-"sg-zzzzzzzz"}
EXECUTION_ROLE_ARN=${EXECUTION_ROLE_ARN:-"arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole"}
TASK_ROLE_ARN=${TASK_ROLE_ARN:-"arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskRole"}

# App configuration (provide real values or use AWS secrets/parameters and wire via task defs)
JWT_SECRET=${JWT_SECRET:?set JWT_SECRET}
MONGO_URI=${MONGO_URI:?set MONGO_URI}
MONGO_TIMEOUT_MS=${MONGO_TIMEOUT_MS:-2000}
NEO4J_URI=${NEO4J_URI:?set NEO4J_URI}
NEO4J_USER=${NEO4J_USER:?set NEO4J_USER}
NEO4J_PASSWORD=${NEO4J_PASSWORD:?set NEO4J_PASSWORD}
NEO4J_ENCRYPTED=${NEO4J_ENCRYPTED:-false}
# Optional vector DB (choose one; or use OpenSearch Service with k-NN below)
VECTORDB_KIND=${VECTORDB_KIND:-}
QDRANT_URL=${QDRANT_URL:-}
PINECONE_API_KEY=${PINECONE_API_KEY:-}
PINECONE_INDEX=${PINECONE_INDEX:-}
# OpenSearch vector alternative
OPENSEARCH_HOST=${OPENSEARCH_HOST:-}
OPENSEARCH_USERNAME=${OPENSEARCH_USERNAME:-}
OPENSEARCH_PASSWORD=${OPENSEARCH_PASSWORD:-}
OPENSEARCH_INDEX=${OPENSEARCH_INDEX:-uniun-vectors}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-""}

# Frontend should point to backend's public URL (ALB or domain)
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-"http://un1un1ExternalALB-2013393754.ap-southeast-1.elb.amazonaws.com:4000"}
NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-""}

BACKEND_TAG=${BACKEND_TAG:-"backend-$(date +%Y%m%d%H%M%S)"}
FRONTEND_TAG=${FRONTEND_TAG:-"frontend-$(date +%Y%m%d%H%M%S)"}

echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
 | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

echo "Ensuring ECR repo exists..."
aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$AWS_REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$ECR_REPO" --region "$AWS_REGION" >/dev/null

echo "Building Docker images..."
docker build -t un1un1-backend:latest ./backend
docker build -t un1un1-frontend:latest --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID="$NEXT_PUBLIC_GOOGLE_CLIENT_ID" ./frontend

echo "Tagging images..."
docker tag un1un1-backend:latest ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:$BACKEND_TAG
docker tag un1un1-frontend:latest ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:$FRONTEND_TAG

echo "Pushing images to ECR..."
docker push ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:$BACKEND_TAG
docker push ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:$FRONTEND_TAG

tmpdir=$(mktemp -d)
cleanup() { rm -rf "$tmpdir"; }
trap cleanup EXIT

echo "Preparing task definition JSONs..."
sed -e "s|${ACCOUNT_ID}|${ACCOUNT_ID}|g" \
    -e "s|${AWS_REGION}|${AWS_REGION}|g" \
    -e "s|${EXECUTION_ROLE_ARN}|${EXECUTION_ROLE_ARN}|g" \
    -e "s|${TASK_ROLE_ARN}|${TASK_ROLE_ARN}|g" \
    -e "s|${JWT_SECRET}|${JWT_SECRET}|g" \
    -e "s|${MONGO_URI}|${MONGO_URI}|g" \
    -e "s|${MONGO_TIMEOUT_MS}|${MONGO_TIMEOUT_MS}|g" \
    -e "s|${NEO4J_URI}|${NEO4J_URI}|g" \
    -e "s|${NEO4J_USER}|${NEO4J_USER}|g" \
    -e "s|${NEO4J_PASSWORD}|${NEO4J_PASSWORD}|g" \
    -e "s|${NEO4J_ENCRYPTED}|${NEO4J_ENCRYPTED}|g" \
  -e "s|${VECTORDB_KIND}|${VECTORDB_KIND}|g" \
  -e "s|${QDRANT_URL}|${QDRANT_URL}|g" \
  -e "s|${PINECONE_API_KEY}|${PINECONE_API_KEY}|g" \
  -e "s|${PINECONE_INDEX}|${PINECONE_INDEX}|g" \
    -e "s|${OPENSEARCH_HOST}|${OPENSEARCH_HOST}|g" \
    -e "s|${OPENSEARCH_USERNAME}|${OPENSEARCH_USERNAME}|g" \
    -e "s|${OPENSEARCH_PASSWORD}|${OPENSEARCH_PASSWORD}|g" \
    -e "s|${OPENSEARCH_INDEX}|${OPENSEARCH_INDEX}|g" \
    -e "s|${GOOGLE_CLIENT_ID}|${GOOGLE_CLIENT_ID}|g" \
    -e "s|${BACKEND_TAG}|${BACKEND_TAG}|g" \
  infra/ecs/taskdef-backend.template.json > "$tmpdir/taskdef-backend.json"

sed -e "s|${ACCOUNT_ID}|${ACCOUNT_ID}|g" \
    -e "s|${AWS_REGION}|${AWS_REGION}|g" \
    -e "s|${EXECUTION_ROLE_ARN}|${EXECUTION_ROLE_ARN}|g" \
    -e "s|${TASK_ROLE_ARN}|${TASK_ROLE_ARN}|g" \
    -e "s|${NEXT_PUBLIC_API_URL}|${NEXT_PUBLIC_API_URL}|g" \
    -e "s|${NEXT_PUBLIC_GOOGLE_CLIENT_ID}|${NEXT_PUBLIC_GOOGLE_CLIENT_ID}|g" \
    -e "s|${FRONTEND_TAG}|${FRONTEND_TAG}|g" \
  infra/ecs/taskdef-frontend.template.json > "$tmpdir/taskdef-frontend.json"

echo "Registering task definitions..."
BACKEND_TASKDEF_ARN=$(aws ecs register-task-definition --cli-input-json file://"$tmpdir/taskdef-backend.json" --query 'taskDefinition.taskDefinitionArn' --output text --region "$AWS_REGION")
FRONTEND_TASKDEF_ARN=$(aws ecs register-task-definition --cli-input-json file://"$tmpdir/taskdef-frontend.json" --query 'taskDefinition.taskDefinitionArn' --output text --region "$AWS_REGION")
echo "Backend task: $BACKEND_TASKDEF_ARN"
echo "Frontend task: $FRONTEND_TASKDEF_ARN"

echo "Preparing service JSONs..."
sed -e "s|${CLUSTER_ARN}|${CLUSTER_ARN}|g" \
    -e "s|${TASKDEF_ARN}|${BACKEND_TASKDEF_ARN}|g" \
    -e "s|${SUBNET_ID_1}|${SUBNET_ID_1}|g" \
    -e "s|${SUBNET_ID_2}|${SUBNET_ID_2}|g" \
    -e "s|${SECURITY_GROUP_ID}|${SECURITY_GROUP_ID}|g" \
    -e "s|${TARGET_GROUP_ARN}|${BACKEND_TARGET_GROUP_ARN}|g" \
  infra/ecs/service-backend.template.json > "$tmpdir/service-backend.json"

if [ -n "${FRONTEND_TARGET_GROUP_ARN}" ]; then
  sed -e "s|${CLUSTER_ARN}|${CLUSTER_ARN}|g" \
    -e "s|${TASKDEF_ARN}|${FRONTEND_TASKDEF_ARN}|g" \
    -e "s|${SUBNET_ID_1}|${SUBNET_ID_1}|g" \
    -e "s|${SUBNET_ID_2}|${SUBNET_ID_2}|g" \
    -e "s|${SECURITY_GROUP_ID}|${SECURITY_GROUP_ID}|g" \
    -e "s|${TARGET_GROUP_ARN}|${FRONTEND_TARGET_GROUP_ARN}|g" \
  infra/ecs/service-frontend.template.json > "$tmpdir/service-frontend.json"
fi

# Helper to create or update a service against an ALB target group
deploy_service() {
  local name=$1 json=$2
  if aws ecs describe-services --cluster "$CLUSTER_ARN" --services "$name" --region "$AWS_REGION" --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
    echo "Updating service $name..."
    aws ecs update-service --cluster "$CLUSTER_ARN" --service "$name" --task-definition $(jq -r '.taskDefinition' "$json") --force-new-deployment --region "$AWS_REGION" >/dev/null
  else
    echo "Creating service $name..."
    aws ecs create-service --cli-input-json file://"$json" --region "$AWS_REGION" >/dev/null
  fi
}

deploy_service "un1un1Service-backend" "$tmpdir/service-backend.json"
if [ -n "${FRONTEND_TARGET_GROUP_ARN}" ]; then
  deploy_service "un1un1Service-frontend" "$tmpdir/service-frontend.json"
else
  echo "Skipping frontend ECS service because FRONTEND_TARGET_GROUP_ARN is not set."
fi

echo "Deployment kicked off. Check ECS console for rollout status."
