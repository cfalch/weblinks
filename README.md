## AWS objects
### DynamoDB
| Table Name | ARN |
| ---------- | --- |
| weblinks | arn:aws:dynamodb:us-east-1:657014233718:table/weblinks |

### Lambda

Created 2 lambdas having:
* Runtime: Node.js 10.x,
* Permissions: Create a new role with basic Lambda permissions

| Function Name | ARN | Execution Role |
| ------------- | --- | -------------- |
| queryWeblinks | arn:aws:iam::657014233718:role/service-role/queryWeblinks-role-yanw3afx | queryWeblinks-role-yanw3afx |

### Policies
The execution role generated for the lambda (above) grants access to Cloudwatch logs. I needed to manually add a separate one for access to the DynamoDB. Followed instructions (here)[https://ordina-jworks.github.io/cloud/2018/10/01/How-to-build-a-Serverless-Application-with-AWS-Lambda-and-DynamoDB.html] to do so.

Policies for role **queryWeblinks-role-yanw3afx**:

| Policy Name | Policy Type | Access to... |
| ----------- | ----------- | ------------ |
| AWSLambdaBasicExecutionRole-9ebb676f-309f-498a-ad2c-49cb7634e989 | Managed | Cloudwatch logs |
| lambda-dynamodb-weblinks-access | Inline | the dynamodb 'weblinks' table for all operations |

### API Gateway
This is the method for invoking the lambda via a url.

- Security: **Open with API key**
- APIEndpoint: https://7fhx9eq7g5.execute-api.us-east-1.amazonaws.com/default/{{operationName}}?{{parameters}}
- API Key: eNj8evospb6YHRJhpwvpe540LrGhPtdT5HwslpOw

All API endpoints use the same Gateway instance and the same Execution Role, so they use the same API key.

| operationName | parameters | body |
| ------------- | ---------- | ---- |
| queryWeblinks | SecretPublicID=%s | NONE
| scanWeblinks | NONE | NONE
| putWeblinks | SecretPublicID=%s | Object[] - list of: {groupName: "", links: []}

