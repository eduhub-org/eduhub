import logging
from api_clients import EduHubClient
import sys

# set working directory to "functions/callPythonFunction"
# sys.path.append("functions/callPythonFunction")


def provide_moochub_data(hasura_secret, arguments):
    """Function to provide course data for the MOOCHub API
    Args:
        hasura_secret (str): Secret to authenticate the user
        arguments (dict): Payload potentially containing function parameters (in this case none)
    Returns:
        str: JSON string containing course data according to the MOOCHub schema
    """

    logging.info("########## Load Participation Data Function ##########")

    # no admin check necessary
    # function is callable by everyone

    eduhub_client = EduHubClient()
    logging.debug(f"eduhub_client.url:  {eduhub_client.url}")

    query = """query {
        Course(where: {_and: {published: {_eq: true}, Program: {published: {_eq: true}}}}) {
            id
            title
            tagline
            coverImage
            language
            ects
            weekDay
            startTime
            endTime
            applicationEnd
            learningGoals
            headingDescriptionField1
            contentDescriptionField1
            headingDescriptionField2
            contentDescriptionField2
            Program {
                id
                shortTitle
            }
        }
    }"""
    courses = eduhub_client.send_query(query, variables=None)

    # filter courses that are an event or a degree program
    courses["data"]["Course"] = [
        course
        for course in courses["data"]["Course"]
        if course["Program"]["shortTitle"] not in ["EVENTS", "DEGREES"]
    ]

    logging.info("Transforming data according to MOOC Hub schema...")

    mooc_hub_response = transform_to_mooc_hub_schema(courses)

    return mooc_hub_response


#############################################################################################
# Helper functions


def transform_to_mooc_hub_schema(courses):
    transformed_data = []
    for course in courses["data"]["Course"]:
        transformed_course = {
            "id": course["id"],
            "type": "courses",
            "attributes": {
                "name": course["title"],
                "courseMode": "MOOC",  # Hardcoded as an example
                "languages": [course["language"]],
                "startDate": course["applicationEnd"],
                "url": "https://edu.opencampus.sh/course/" + str(course["id"]),
                "abstract": course["tagline"],
                "description": str(course["headingDescriptionField1"])
                + "\n"
                + str(course["contentDescriptionField1"])
                + "\n\n"
                + str(course["headingDescriptionField2"])
                + "\n"
                + str(course["contentDescriptionField2"]),
                "moocProvider": "opencampus.sh",
                "image": {
                    "url": course["coverImage"],
                    "alt": course["title"],
                },
                # Add other attributes based on your Hasura data
            },
        }
        transformed_data.append(transformed_course)

    mooc_hub_response = {
        "links": {
            "self": "https://edu.opencampus.sh",
        },
        "data": transformed_data,
    }

    return mooc_hub_response
