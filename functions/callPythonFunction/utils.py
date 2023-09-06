import os


def is_admin(hasura_secret, arguments):
    hasura_cloud_function_secret = os.getenv("HASURA_CLOUD_FUNCTION_SECRET")
    # check if the user is admin
    if hasura_secret == hasura_cloud_function_secret:
        if arguments["session_variables"]["x-hasura-role"] == "admin":
            return True
        else:
            raise Exception("error: user is not admin!")
    else:
        if not hasura_secret:
            raise Exception("error: no secret value provided!")
        if hasura_secret == "HASURA_CLOUD_FUNCTION_SECRET":
            raise Exception(
                "error: header secret value is not set from environment in Hasura!"
            )
        if hasura_secret != hasura_cloud_function_secret:
            raise Exception("error: cloud function secret is not correct!")
