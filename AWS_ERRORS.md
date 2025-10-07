Analysis
The error message indicates that the user is unable to create the ECS cluster due to an issue with the service-linked role. The service-linked role is a special type of IAM role that allows ECS to access other AWS services on your behalf, and it appears that this role is not properly configured or does not exist.
Resolution
Try the following steps to resolve your error:


If you don't have permissions to do the following changes, contact your AWS Administrator

Navigate to the IAM console in the AWS Management Console

In the left navigation pane, click on 'Roles'

In the search bar, type 'AWSServiceRoleForECS' to check if the role exists

If the role doesn't exist, follow these sub-steps:

Click on 'Create role'
Under 'Trusted entity type', select 'AWS service'
Under 'Use case', select 'Elastic Container Service'
Choose 'Elastic Container Service - Service Role'
Click 'Next'
Review the permissions and click 'Create role'
If the role exists but there might be an issue with permissions, verify the role has the correct policy:

Click on the 'AWSServiceRoleForECS' role
In the 'Permissions' tab, ensure the 'AmazonECSServiceRolePolicy' is attached
If the policy is missing, attach it:

Click 'Add permissions', then 'Attach policies'
Search for 'AmazonECSServiceRolePolicy'
Select it and click 'Add permissions'
Return to the ECS console and attempt to create the cluster 'un1un1-cluster' again

If the issue persists, check the trust relationship of the 'AWSServiceRoleForECS' role:

In the IAM console, click on the 'AWSServiceRoleForECS' role
Go to the 'Trust relationships' tab
Click 'Edit trust relationship'
Ensure the policy document includes:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
If it's different, update it and save changes
Try creating the ECS cluster 'un1un1-cluster' once more