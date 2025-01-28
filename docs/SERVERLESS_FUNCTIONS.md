# Serverless Functions Development Guide

## Overview
This guide covers the development of serverless functions in our system, ensuring consistency and maintainability across all implementations.

## Table of Contents
1. [Basic Python Function Template](#basic-python-function-template)
2. [Implementation Steps](#implementation-steps)
3. [Naming Conventions](#naming-conventions)


## Standard Function Template

Both Python and Node.js implementations should follow this common structure:

### Response Format
```typescript
interface StandardResponse {
  success: boolean;      // Required: Operation success status
  messageKey: string;    // Required: Translation key for UI messages
  error?: string;        // Optional: Error message if success is false
  [key: string]: any;    // Additional function-specific data
}
```

### Python Implementation
```python
from typing import Dict, Any
import logging

def template_function(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Description of what the function does.
    
    Args:
        args (dict): Contains:
            - input (dict): The input parameters
            - session_variables (dict): Hasura session variables
                - x-hasura-role (str): User role
                - x-hasura-user-id (str): User UUID
    
    Returns:
        dict: StandardResponse containing:
            - success (bool): Whether operation was successful
            - messageKey (str): Translation key for messages
            - error (str, optional): Error message if failed
            - [additional_field] (type): Additional return fields
    """
    logger.info("########## Template Function ##########")
    logger.debug("Request parameters", {
        "input": args.get("input"),
        "role": args.get("session_variables", {}).get("x-hasura-role"),
        "userId": args.get("session_variables", {}).get("x-hasura-user-id")
    })

    try:
        # Your function logic here
        result = do_something(args["input"])
        
        logger.info("Operation successful", {
            "userId": args["session_variables"]["x-hasura-user-id"]
        })
        return {
            "success": True,
            "messageKey": "OPERATION_SUCCESS",
            "result": result  # Additional function-specific data
        }

    except ValueError as e:
        logger.error("Invalid input", {
            "error": str(e),
            "userId": args["session_variables"]["x-hasura-user-id"]
        })
        return {
            "success": False,
            "messageKey": "INVALID_INPUT",
            "error": str(e)
        }
        
    except Exception as e:
        logger.error("Operation failed", {
            "error": str(e),
            "stack": traceback.format_exc(),
            "userId": args["session_variables"]["x-hasura-user-id"]
        })
        return {
            "success": False,
            "messageKey": "OPERATION_FAILED",
            "error": "An error occurred during the operation."
        }
```

### Node.js Implementation
```javascript
/**
 * Description of what the function does.
 *
 * @param {Object} req Request object containing:
 *   - body.input (Object): The input parameters
 *   - body.session_variables (Object): Hasura session variables
 *     - x-hasura-role (string): User role
 *     - x-hasura-user-id (string): User UUID
 * @returns {Promise<StandardResponse>} Response containing standard fields
 */
const templateFunction = async (req) => {
  logger.info("########## Template Function ##########");
  logger.debug("Request parameters", {
    input: req.body.input,
    role: req.body.session_variables['x-hasura-role'],
    userId: req.body.session_variables['x-hasura-user-id']
  });

  try {
    // Your function logic here
    const result = await doSomething(req.body.input);
    
    logger.info("Operation successful", {
      userId: req.body.session_variables['x-hasura-user-id']
    });
    return {
      success: true,
      messageKey: "OPERATION_SUCCESS",
      result  // Additional function-specific data
    };

  } catch (error) {
    logger.error("Operation failed", {
      error: error.message,
      stack: error.stack,
      userId: req.body.session_variables['x-hasura-user-id']
    });

    if (error instanceof ValidationError) {
      return {
        success: false,
        messageKey: "INVALID_INPUT",
        error: error.message
      };
    }

    return {
      success: false,
      messageKey: "OPERATION_FAILED",
      error: "An error occurred during the operation."
    };
  }
};

export default templateFunction;
```

## Implementation Steps

### Common Implementation Patterns

1. **Function Structure**
   - Clear documentation of parameters and return type
   - Consistent logging at start of function
   - Standard error handling pattern
   - Uniform response format

2. **Logging**
   - Start marker with function name
   - Debug log of input parameters
   - Success/failure outcomes with context
   - Error details with stack traces
   - Always include userId for tracking

3. **Error Handling**
   - Validation errors (INVALID_INPUT)
   - Permission errors (UNAUTHORIZED)
   - General errors (OPERATION_FAILED)
   - Always include messageKey and error description

4. **Response Format**
   - Always include `success` boolean
   - Always include `messageKey` string
   - Include `error` string when success is false
   - Additional data fields at root level (not nested)

5. **Message Keys**
   Common keys for both implementations:
   ```typescript
   enum CommonMessageKeys {
     OPERATION_SUCCESS = "OPERATION_SUCCESS",
     INVALID_INPUT = "INVALID_INPUT",
     UNAUTHORIZED = "UNAUTHORIZED",
     OPERATION_FAILED = "OPERATION_FAILED"
   }
   ```

### Implementation Steps for Python Functions

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

### Implementation Steps for Node.js Functions

1. **Create Function File**
   - Place in `functions/callNodeFunction/yourFunctionName/`
   - Use camelCase for filename: `index.js`

2. **Register Function**
   ```javascript:functions/callNodeFunction/index.js
   import yourFunction from "./yourFunctionName/index.js";

   const functionMap = {
     // ... existing functions ...
     yourFunction
   };
   ```

3. **Define a Trigger or Action in Hasura**
   Same as Python functions (see above)

4. **Create Frontend Query**
   Same as Python functions (see above)

5. **Add Translation Keys**
   Same as Python functions (see above)


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
