# Serverless Functions Development Guide

## Overview
This guide covers the development of serverless functions in our system, ensuring consistency and maintainability across all implementations.

## Table of Contents
0. [Units and Shared Code](#units-and-shared-code)
1. [Basic Python Function Template](#basic-python-function-template)
2. [Implementation Steps](#implementation-steps)
3. [Naming Conventions](#naming-conventions)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Documentation Requirements](#documentation-requirements)

## Units and Shared Code

- `functions/units.json` lists every deployed unit (name, runtime, entry
  point, local port). The zip workflow
  (`.github/workflows/zip-and-store-cloud-functions.yml`) packages exactly
  these, and `functions/dev.js` / `functions/dev.py` start them locally.
- Every Node unit is ESM (`"type": "module"`) and commits its own
  `package-lock.json`; Cloud Functions builds each zip on its own with
  `npm ci`. Change dependencies with `npm install <pkg>` inside the unit.
- Shared Node code lives in `functions/shared/` (ESM, **no dependencies**).
  A unit that needs it has a committed symlink `shared -> ../shared` and
  imports `./shared/<file>.js` (or `../shared/...` from a handler folder).
  Python units link `api_clients -> ../shared_py/api_clients` the same way.
- `zip -r` follows these symlinks, so each archive contains real copies; the
  workflow fails if an archive still holds a symlink. On Windows, enable
  `core.symlinks` (and Developer Mode) before cloning.
- To add a Node unit that uses shared code:
  `ln -s ../shared functions/<unit>/shared`, then add it to `units.json`.


## Basic Python Function Template

```python
from typing import Dict, Any
import logging

def template_function(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Description of what the function does.
    
    Args:
    arguments (dict): Contains:
        - input.param1 (type): Description
        - input.param2 (type): Description
    
    Returns:
    dict: Response containing:
        - success (bool): Whether the operation was successful
        - error (str, optional): Error message if operation failed
        - messageKey (str): Translation key for messages
        - [additional_field] (type): Description of additional return fields
    """
    logging.info("########## Template Function ##########")
    logging.debug(f"Arguments: {arguments}")
    try:
        # Your function logic here
        result = do_something(arguments)
        return {
            "success": True,
            "messageKey": "OPERATION_SUCCESS",
            # Additional result fields
        }
    except ValueError as e:
        logging.error(f"Invalid input: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "messageKey": "INVALID_INPUT"
        }
    except Exception as e:
        logging.error(f"Error in template function: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "messageKey": "OPERATION_FAILED"
        }
```


## Implementation Steps

1. **Create Function File**
   - Path: `functions/callPythonFunction/pythonFunctions/your_function_name.py`
   - Naming: Use snake_case (e.g., `create_certificates.py`)
   - Required imports:
     ```python
     from typing import Dict, Any
     import logging
     ```

2. **Register Function**
   - File: `functions/callPythonFunction/main.py`
   - Import and register pattern:
     ```python
     from pythonFunctions.your_function_name import your_function_name
     
     PYTHON_FUNCTIONS: Dict[str, Callable] = {
         "your_function_name": your_function_name,
     }
     ```

3. **Define a Trigger or Action in Hasura**
  An action you can define as follows in the Hasura console:
   ```graphql
   type Mutation {
     yourFunctionName(param1: Type!, param2: Type): YourFunctionResult!
   }
   ```
   With the result type defined as follows (under Type Configuration):
   ```graphql
   type YourFunctionResult {
     success: Boolean!
     messageKey: String!
     error: String
     # Additional fields specific to your function
   }
   ```
   The Webhook URL you set to `{CLOUD_FUNCTION_LINK_CALL_PYTHON_FUNCTION}}`, which will be set according to the current environment.

   Set the following mandatory headers:
   - `Hasura-Secret`: choose 'From env var' and set it to `HASURA_CLOUD_FUNCTION_SECRET`
   - `Function-Name`: choose 'Value' and set it to `your_function_name`
   Optional header:
   - `Bucket`: choose 'From env var' and set it to `HASURA_BUCKET`

   ⚠️ **Important**: For functions that return a response (most cases), set the execution mode to `Synchronous`. 
   It is set to `Asynchronous` by default, which will cause errors when trying to access the response fields.

4. **Create Frontend Query**
   - File: `frontend-nx/apps/edu-hub/queries/actions.ts`
   - Add GraphQL mutation:
     ```typescript
     export const YOUR_FUNCTION = gql`
       mutation yourFunctionName($param1: Type!, $param2: Type) {
         yourFunctionName(param1: $param1, param2: $param2) {
           success
           messageKey
           error
           # Additional fields
         }
       }
     `;
     ```

5. **Add Translation Keys**
   If you use messageKeys in your function, you need to add them in the specific language file of the component calling the function.

## Naming Conventions

1. **Python**
   - Function names: `snake_case`
   - Variables: `snake_case`
   - Classes: `PascalCase`
   - Constants: `UPPER_SNAKE_CASE`

2. **GraphQL**
   - Types: `PascalCase` with `Result` suffix (e.g., `CreateCertificatesResult`)
   - Mutations/Queries: `camelCase`
   - Fields: `camelCase`

3. **TypeScript**
   - Constants: `UPPER_SNAKE_CASE`
   - Components: `PascalCase`
   - Functions/Methods: `camelCase`
   - Files: Match component name if containing a component

4. **Message Keys**
   - Format: `UPPERCASE_WITH_UNDERSCORES`
   - Categories:
     - Success: `OPERATION_SUCCESS`
     - Input Error: `INVALID_INPUT`
     - General Error: `OPERATION_FAILED`

## Response Format

All functions should return a standardized response:
```python
{
  "success": bool, # Required: Operation success status
  "messageKey": str, # Required: Translation key for UI messages
  "error": str, # Optional: Error message if success is False
  # Additional fields specific to the function
}
```
Do not use a nested data object to return the result of the function but rather return the fields directly in the response.

## Error Handling

1. **Standard Error Types**
   - `ValueError` for invalid inputs
   - `Exception` as fallback for unexpected errors
   - Custom exceptions for specific business logic

2. **Error Response Format**
   ```python
   {
       "success": False,
       "error": str(e),  # Human-readable error message
       "messageKey": "ERROR_TYPE"  # Translation key for frontend
   }
   ```

3. **Common Message Keys**
   - `INVALID_INPUT`: Input validation failures
   - `UNAUTHORIZED`: Permission issues
   - `OPERATION_FAILED`: General operation failures
   - `NOT_FOUND`: Resource not found
   - `INTERNAL_ERROR`: Unexpected system errors

4. **Logging**
   - Always log errors with stack traces
   - Include relevant context but no sensitive data
   - Use appropriate log levels (ERROR for errors, INFO for operations)

## Documentation Requirements

1. **Function Docstring**
   ```python
   """Short description of function purpose.
   
   Args:
       arguments (dict): Contains:
           - input.param1 (type): Description
           - input.param2 (type): Description
           
   Returns:
       dict: Response containing:
           - success (bool): Operation status
           - messageKey (str): Translation key
           - error (str, optional): Error message
   """
   ```

2. **Code Comments**
   - Explain complex business logic
   - Document assumptions
   - Note any side effects

## Common Pitfalls
1. **Function Registration**
   - Ensure function name in `main.py` matches the `Function-Name` header
   - Function name must be snake_case in Python, camelCase in GraphQL

2. **Error Handling**
   - Always return the standard response format
   - Log errors before returning
   - Use appropriate message keys

3. **Type Safety**
   - Use type hints in Python functions
   - Validate input parameters
   - Match GraphQL types with Python types

4. **Testing**
   - Test with various input combinations
   - Verify error handling
   - Check translation keys exist
