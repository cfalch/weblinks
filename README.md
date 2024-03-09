## GitHub credentials
Use a simple access key configure in the repository locally. Once configured, you don't ned to type userid or password to push to the repo, however it does require you to have an active, non-expired access key configured. To do so:

- Log into Git Hub
- click on user icon (top right corner)
- Settings > Developer settings
- Personal Access Tokens
- Generate new token, with:
  - **note**: 'to push to weblinks' (or whatever)
  - **expiration**: 7 days (or whatever)
  - **scopes**: 'repo' (the first choice)
- copy the resulting key

Open the file /weblinks/.git/config, then under [remote "origin"] update the secret in 'url':

  `url = https://cfalch:<<secret>>@github.com ...`

Then a normal `git push` should succeed.

## AWS objects
### DynamoDB
| Table Name | ARN |
| ---------- | --- |
| weblinks | arn:aws:dynamodb:us-east-1:657014233718:table/weblinks |

### Lambda

Created 2 lambdas having:
* Runtime: Node.js 10.x, (updated to 14.x Apr 2022)
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


March 2024: I "disabled" scanWeblinks by changing its concurrency to 0. I don't believe it's in-use by the Angular app, but didn't look for sure. To re-enable, go into AWS lambda console, Configuration tab, Concurrency section and change it from `Reserve Concurrency 0` to `Use unreserved account concurrency`.