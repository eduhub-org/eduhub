# Adding a New Python Backend Function

Welcome to the guide on how to contribute by adding a new Python backend function to our project. We value your contributions, and this guide aims to ensure the process is smooth and clear.

## **Prerequisites**

1. Familiarity with Hasura, Python, and serverless functions.
2. Ensure you have access to the necessary environment variables if you'll be interfacing with production instances of Mattermost, LimeSurvey, or ZoomClient.

## **Step 1: Local Development Without Server Request**

Before integrating your function into the main server, start by testing your function in a local environment.

1. **Set Up Your Function**:
   - Navigate to `function/callPythonFunctions/pythonFunctions`.
   - Create a new Python file (you can copy from an existing one for a template).
   - Modify the file according to your function's requirements.

2. **Interacting with EduHubClient**:
   - Check existing methods in `EduHubClient` to see if they fit your needs.
   - If necessary, implement a new query or mutation:
     - Start by using `eduhub_client.send_query(query, variables)`.
     - Define your query and the required variables.
     - Test your query to ensure it works as expected.
     - Prepare your query result (preferably to pandas dataframe).
     - Once verified, add your code as a new method to the `EduHubClient`.
     - Update the `EduHubClient` library (e.g., easiest is selecting the complete code in the file and executing it).

3. **Note on External Services**: If you're using Mattermost, LimeSurvey, or ZoomClient, remember that development and testing require access to production instances. Provide local access data by updating the environment variables in `start-python.env` (this file is git-ignored).

## **Step 2: Local Testing of the Serverless Function**

After verifying your function's local operation, integrate it with Hasura.

1. **Setting Custom Headers**:
   - Every function requires specific headers:
     - `Hasura-Secret`: Set this to the value from the environment variable `HASURA_CLOUD_FUNCTION_SECRET`.
     - `Function-Name`: This should match the name of the Python function you added in the previous step.

2. **Trigger Your Function**:
   - Depending on your requirements, you can trigger your function via Hasura in different ways:
     - Cron job ("event").
     - Database trigger ("event").
     - Frontend function call ("action").

   Note: The method you choose to trigger your function (either "action" or "event") will dictate the format of the arguments passed to your Python function.

## **Step 3: Testing in the Staging Environment**

Before making your function live, it's crucial to test it in a staging environment.

1. **Deploying Your Function**:
   - In most cases, you won't need to modify the deployment process.
   - The CI/CD flow will auto-update the Python serverless function after a successful pull request and merge to the staging branch.
