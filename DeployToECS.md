# Docker Tag & Push to ECR:
    Use the following steps to authenticate and push an image to your repository. For additional registry authentication methods, including the Amazon ECR credential helper, see Registry authentication .
    Retrieve an authentication token and authenticate your Docker client to your registry. Use the AWS CLI:
    aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 791704693413.dkr.ecr.ap-southeast-1.amazonaws.com
    Note: if you receive an error using the AWS CLI, make sure that you have the latest version of the AWS CLI and Docker installed.
    Build your Docker image using the following command. For information on building a Docker file from scratch, see the instructions here . You can skip this step if your image has already been built:
    docker build -t un1un1 .
    After the build is completed, tag your image so you can push the image to this repository:
    docker tag un1un1:latest 791704693413.dkr.ecr.ap-southeast-1.amazonaws.com/un1un1:latest
    Run the following command to push this image to your newly created AWS repository:
    docker push 791704693413.dkr.ecr.ap-southeast-1.amazonaws.com/un1un1:latest

# Deploy to ECS Service:
    Update the TaskDefinition of the Service with latest ECR Image, pushed using above steps
    Update the Service with new TaskDefinition, wait for the service to get stable.