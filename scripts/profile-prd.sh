#!/usr/bin/env bash
set -euo pipefail

# This script orchestrates a full production deploy using the existing deploy-ecs.sh and then runs
# sanity checks: ALB health, ECS service/task stability, log streams presence, and basic reachability.

ACCOUNT_ID=${ACCOUNT_ID:?set ACCOUNT_ID}
AWS_REGION=${AWS_REGION:?set AWS_REGION}
CLUSTER_ARN=${CLUSTER_ARN:?set CLUSTER_ARN}
BACKEND_SERVICE_NAME=${BACKEND_SERVICE_NAME:-un1un1Service-backend}
FRONTEND_SERVICE_NAME=${FRONTEND_SERVICE_NAME:-un1un1Service-frontend}
ALB_PUBLIC_URL=${ALB_PUBLIC_URL:?set ALB_PUBLIC_URL} # e.g., http://your-alb-dns

echo "[prd] Building, pushing, and deploying via scripts/deploy-ecs.sh"
./scripts/deploy-ecs.sh

echo "[prd] Waiting for ECS services to stabilize..."
aws ecs wait services-stable --cluster "$CLUSTER_ARN" --services "$BACKEND_SERVICE_NAME" --region "$AWS_REGION"
if aws ecs describe-services --cluster "$CLUSTER_ARN" --services "$FRONTEND_SERVICE_NAME" --region "$AWS_REGION" --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
  aws ecs wait services-stable --cluster "$CLUSTER_ARN" --services "$FRONTEND_SERVICE_NAME" --region "$AWS_REGION"
fi

echo "[prd] Health checks against ALB"
curl -sS -o /dev/null -w "backend /health: %{http_code}\n" "$ALB_PUBLIC_URL:4000/health" || true
curl -sS -o /dev/null -w "frontend /: %{http_code}\n" "$ALB_PUBLIC_URL/" || true
curl -sSI "$ALB_PUBLIC_URL/avatars/veee.png" | head -n 1 || true

echo "[prd] Checking ECS tasks and log streams"
for svc in "$BACKEND_SERVICE_NAME" "$FRONTEND_SERVICE_NAME"; do
  if aws ecs describe-services --cluster "$CLUSTER_ARN" --services "$svc" --region "$AWS_REGION" --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
    arn=$(aws ecs describe-services --cluster "$CLUSTER_ARN" --services "$svc" --region "$AWS_REGION" --query 'services[0].taskDefinition' --output text)
    echo "  Service $svc uses taskdef: $arn"
  fi
done

echo "[prd] Recent CloudWatch log streams (if configured)"
for group in /ecs/un1un1/backend /ecs/un1un1/frontend; do
  aws logs describe-log-streams --log-group-name "$group" --order-by LastEventTime --descending --limit 3 --region "$AWS_REGION" --query 'logStreams[].logStreamName' --output text || true
done

echo "[prd] Basic security group reachability is implicit; ensure DB endpoints allow access from service subnets/SGs."
echo "[prd] Done. Verify the app at $ALB_PUBLIC_URL and API at $ALB_PUBLIC_URL:4000"
