#!/usr/bin/env bash
set -euo pipefail

ACCOUNT_ID="791704693413"
AWS_REGION="ap-southeast-1"
ECR_REPO="un1un1"
CLUSTER_ARN="arn:aws:ecs:ap-southeast-1:791704693413:cluster/Un1un1Cluster"
TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:ap-southeast-1:791704693413:targetgroup/un1un1ExternalALBTG/dee0186f8f5e0068"
BACKEND_TARGET_GROUP_ARN=${BACKEND_TARGET_GROUP_ARN:-""}
LISTENER_ARN=${LISTENER_ARN:-""}

# REQUIRED env or export before running
SUBNET_ID_1=${SUBNET_ID_1:-"subnet-xxxxxxxx"}
SUBNET_ID_2=${SUBNET_ID_2:-"subnet-yyyyyyyy"}
SECURITY_GROUP_ID=${SECURITY_GROUP_ID:-"sg-zzzzzzzz"}
EXECUTION_ROLE_ARN=${EXECUTION_ROLE_ARN:-"arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole"}
TASK_ROLE_ARN=${TASK_ROLE_ARN:-"arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskRole"}

# App configuration (defaults wire to local sidecars in the task)
JWT_SECRET=${JWT_SECRET:-"change-me"}
MONGO_URI=${MONGO_URI:-"mongodb://127.0.0.1:27017/uniun"}
NEO4J_URI=${NEO4J_URI:-"bolt://127.0.0.1:7687"}
NEO4J_USER=${NEO4J_USER:-"neo4j"}
NEO4J_PASSWORD=${NEO4J_PASSWORD:-"neo4jpassword"}
NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-""}

BACKEND_TAG=${BACKEND_TAG:-$(aws ecr describe-images --repository-name "$ECR_REPO" --region "$AWS_REGION" --query 'reverse(sort_by(imageDetails,& imagePushedAt))' --output json | jq -r '[.[] | .imageTags // [] | .[] | select(test("^backend-"))][0] // empty')}
FRONTEND_TAG=${FRONTEND_TAG:-$(aws ecr describe-images --repository-name "$ECR_REPO" --region "$AWS_REGION" --query 'reverse(sort_by(imageDetails,& imagePushedAt))' --output json | jq -r '[.[] | .imageTags // [] | .[] | select(test("^frontend-"))][0] // empty')}
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

echo "Ensuring IAM roles and CloudWatch log groups exist..."

# Create/ensure ecsTaskExecutionRole with correct trust and policy
cat >"$tmpdir/execution-trust.json" <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ecs-tasks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
if ! aws iam get-role --role-name ecsTaskExecutionRole --region "$AWS_REGION" >/dev/null 2>&1; then
  aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file://"$tmpdir/execution-trust.json" \
    --description "ECS task execution role for pulling images and publishing logs" \
    --region "$AWS_REGION" >/dev/null
  aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
    --region "$AWS_REGION" >/dev/null
fi

# Ensure trust relationship is correct (idempotent)
cat >"$tmpdir/execution-trust.json" <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ecs-tasks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
aws iam update-assume-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-document file://"$tmpdir/execution-trust.json" \
  --region "$AWS_REGION" >/dev/null || true

# Create/ensure ecsTaskRole with correct trust (app permissions can be attached later if needed)
cat >"$tmpdir/task-trust.json" <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ecs-tasks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
if ! aws iam get-role --role-name ecsTaskRole --region "$AWS_REGION" >/dev/null 2>&1; then
  aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document file://"$tmpdir/task-trust.json" \
    --description "Application IAM role assumed by ECS tasks" \
    --region "$AWS_REGION" >/dev/null
fi
aws iam update-assume-role-policy \
  --role-name ecsTaskRole \
  --policy-document file://"$tmpdir/task-trust.json" \
  --region "$AWS_REGION" >/dev/null || true

# Resolve latest role ARNs (in case they differ across accounts)
EXECUTION_ROLE_ARN=$(aws iam get-role --role-name ecsTaskExecutionRole --query 'Role.Arn' --output text --region "$AWS_REGION")
TASK_ROLE_ARN=$(aws iam get-role --role-name ecsTaskRole --query 'Role.Arn' --output text --region "$AWS_REGION")

# Ensure required CloudWatch log groups exist with a sane retention
for lg in "/ecs/un1un1/backend" "/ecs/un1un1/frontend" "/ecs/un1un1/mongo" "/ecs/un1un1/neo4j"; do
  if ! aws logs describe-log-groups --log-group-name-prefix "$lg" --query 'logGroups[?logGroupName==`'"$lg"'`]|length(@)' --output text --region "$AWS_REGION" | grep -q '^1$'; then
    aws logs create-log-group --log-group-name "$lg" --region "$AWS_REGION" >/dev/null || true
    aws logs put-retention-policy --log-group-name "$lg" --retention-in-days 14 --region "$AWS_REGION" >/dev/null || true
  fi
done

if [ -z "$BACKEND_TAG" ] || [ -z "$FRONTEND_TAG" ]; then
  echo "Could not determine image tags. Set BACKEND_TAG and FRONTEND_TAG explicitly." >&2
  exit 1
fi

echo "Preparing monolithic task definition..."
export ACCOUNT_ID AWS_REGION EXECUTION_ROLE_ARN TASK_ROLE_ARN JWT_SECRET MONGO_URI NEO4J_URI NEO4J_USER NEO4J_PASSWORD NEXT_PUBLIC_GOOGLE_CLIENT_ID BACKEND_TAG FRONTEND_TAG
if command -v envsubst >/dev/null 2>&1; then
  envsubst < infra/ecs/taskdef-mono.template.json > "$tmpdir/taskdef.json"
else
  # Fallback replaces literal placeholders like ${VAR}
  sed -e "s|\${ACCOUNT_ID}|$ACCOUNT_ID|g" \
      -e "s|\${AWS_REGION}|$AWS_REGION|g" \
      -e "s|\${EXECUTION_ROLE_ARN}|$EXECUTION_ROLE_ARN|g" \
      -e "s|\${TASK_ROLE_ARN}|$TASK_ROLE_ARN|g" \
      -e "s|\${JWT_SECRET}|$JWT_SECRET|g" \
      -e "s|\${MONGO_URI}|$MONGO_URI|g" \
      -e "s|\${NEO4J_URI}|$NEO4J_URI|g" \
      -e "s|\${NEO4J_USER}|$NEO4J_USER|g" \
      -e "s|\${NEO4J_PASSWORD}|$NEO4J_PASSWORD|g" \
      -e "s|\${NEXT_PUBLIC_GOOGLE_CLIENT_ID}|$NEXT_PUBLIC_GOOGLE_CLIENT_ID|g" \
      -e "s|\${BACKEND_TAG}|$BACKEND_TAG|g" \
      -e "s|\${FRONTEND_TAG}|$FRONTEND_TAG|g" \
    infra/ecs/taskdef-mono.template.json > "$tmpdir/taskdef.json"
fi

echo "Registering task definition..."
TASKDEF_ARN=$(aws ecs register-task-definition --cli-input-json file://"$tmpdir/taskdef.json" --query 'taskDefinition.taskDefinitionArn' --output text --region "$AWS_REGION")
echo "Task: $TASKDEF_ARN"

echo "Preparing service JSON..."
export CLUSTER_ARN TASKDEF_ARN SUBNET_ID_1 SUBNET_ID_2 SECURITY_GROUP_ID TARGET_GROUP_ARN
export BACKEND_TARGET_GROUP_ARN
if command -v envsubst >/dev/null 2>&1; then
  envsubst < infra/ecs/service-mono.template.json > "$tmpdir/service.json"
else
  sed -e "s|\${CLUSTER_ARN}|$CLUSTER_ARN|g" \
      -e "s|\${TASKDEF_ARN}|$TASKDEF_ARN|g" \
      -e "s|\${SUBNET_ID_1}|$SUBNET_ID_1|g" \
      -e "s|\${SUBNET_ID_2}|$SUBNET_ID_2|g" \
      -e "s|\${SECURITY_GROUP_ID}|$SECURITY_GROUP_ID|g" \
      -e "s|\${TARGET_GROUP_ARN}|$TARGET_GROUP_ARN|g" \
    infra/ecs/service-mono.template.json > "$tmpdir/service.json"
fi

SERVICE_NAME="un1un1Service"
if [[ "$SUBNET_ID_1" == subnet-xxxx* || "$SUBNET_ID_2" == subnet-yyyy* || "$SECURITY_GROUP_ID" == sg-zzzz* ]]; then
  echo "Skipping service creation/update: set SUBNET_ID_1, SUBNET_ID_2, SECURITY_GROUP_ID to real values, then rerun." >&2
  echo "Task definition registered: $TASKDEF_ARN"
  exit 0
fi

echo "Deploying service $SERVICE_NAME..."
if aws ecs describe-services --cluster "$CLUSTER_ARN" --services "$SERVICE_NAME" --region "$AWS_REGION" --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
  aws ecs update-service --cluster "$CLUSTER_ARN" --service "$SERVICE_NAME" --task-definition "$TASKDEF_ARN" --force-new-deployment --region "$AWS_REGION" >/dev/null
else
  aws ecs create-service --cli-input-json file://"$tmpdir/service.json" --region "$AWS_REGION" >/dev/null
fi

echo "Deployment initiated. Monitor ECS console for rollout and target group health."

# Optionally ensure ALB path rules to route static/media to backend
if [[ -n "$LISTENER_ARN" && -n "$BACKEND_TARGET_GROUP_ARN" ]]; then
  echo "Ensuring ALB listener rules for /api/*, /uploads/*, /avatars/* -> backend..."
  ensure_rule() {
    local pattern="$1"; local priority="$2"
    local exists
    exists=$(aws elbv2 describe-rules --listener-arn "$LISTENER_ARN" --region "$AWS_REGION" --query "Rules[?contains(Conditions[?Field=='path-pattern'].Values[][], '\\$pattern')].RuleArn" --output text 2>/dev/null || true)
    if [[ -z "$exists" || "$exists" == "None" ]]; then
      aws elbv2 create-rule \
        --listener-arn "$LISTENER_ARN" \
        --priority "$priority" \
        --conditions "Field=path-pattern,Values=$pattern" \
        --actions Type=forward,TargetGroupArn="$BACKEND_TARGET_GROUP_ARN" \
        --region "$AWS_REGION" >/dev/null
      echo "Created rule for $pattern at priority $priority"
    else
      echo "Rule for $pattern already exists: $exists"
    fi
  }
  # Keep /api/* at a higher priority (lower number) than defaults; choose gaps to avoid conflicts
  ensure_rule "/api/*" 10
  ensure_rule "/uploads/*" 11
  ensure_rule "/avatars/*" 12
  # WebSocket upgrade path used by backend ws-server
  ensure_rule "/ws" 13
  ensure_rule "/ws/*" 14
fi
