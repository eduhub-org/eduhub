import logging
from datetime import datetime, timedelta, timezone
from api_clients import EduHubClient
from pythonFunctions.limesurvey_location_mapping import LIMESURVEY_LOCATION_MAPPING


def update_enrollment_locations(arguments):
    """
    Updates CourseEnrollment.location based on attendance data from last 24 hours.
    Priority: LimeSurvey location > ONLINE (Zoom-only)
    
    Logic:
    - If participant has at least one LIMESURVEY attendance → use that location (KIEL, HEIDE)
    - Else if only ZOOM attendances → set location to "ONLINE"
    
    Args:
        arguments (dict): Payload potentially containing function parameters (in this case none)
        
    Returns:
        dict: Response containing:
            - success (bool): Whether the operation was successful
            - data (dict, optional): Statistics about updated enrollments
            - error (str, optional): Error message if operation failed
    """
    logging.info("########## Update Enrollment Locations Function ##########")
    logging.debug(f"arguments: {arguments}")

    try:
        eduhub_client = EduHubClient()
        
        # Calculate time 24 hours ago (using UTC)
        now = datetime.now(timezone.utc)
        twenty_four_hours_ago = now - timedelta(hours=24)
        # Format for GraphQL (ISO 8601 format with timezone)
        time_threshold = twenty_four_hours_ago.isoformat()
        
        logging.info(f"Querying sessions that ended after {time_threshold}")
        
        # Query sessions that ended in the last 24 hours
        sessions_query = """
        query GetRecentSessions($timeThreshold: timestamptz!) {
            Session(
                where: {
                    endDateTime: {_gte: $timeThreshold}
                }
            ) {
                id
                courseId
                endDateTime
            }
        }
        """
        
        sessions_result = eduhub_client.send_query(
            sessions_query,
            {"timeThreshold": time_threshold}
        )
        
        if sessions_result.get("data") is None:
            error_msg = f"Failed to query sessions: {sessions_result}"
            logging.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }
        
        sessions = sessions_result["data"]["Session"]
        logging.info(f"Found {len(sessions)} sessions in the last 24 hours")
        
        if len(sessions) == 0:
            return {
                "success": True,
                "data": {
                    "sessions_processed": 0,
                    "enrollments_updated": 0,
                    "message": "No sessions found in the last 24 hours"
                }
            }
        
        # Collect unique course IDs
        course_ids = list({session["courseId"] for session in sessions})
        
        logging.info(f"Found {len(course_ids)} unique courses with sessions in the last 24 hours")
        
        # Query all enrollments for these courses
        enrollments_query = """
        query GetEnrollments($courseIds: [Int!]!) {
            CourseEnrollment(
                where: {
                    courseId: {_in: $courseIds}
                }
            ) {
                id
                userId
                courseId
                location
            }
        }
        """
        
        enrollments_result = eduhub_client.send_query(
            enrollments_query,
            {"courseIds": course_ids}
        )
        
        if enrollments_result.get("data") is None:
            error_msg = f"Failed to query enrollments: {enrollments_result}"
            logging.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }
        
        enrollments = enrollments_result["data"]["CourseEnrollment"]
        logging.info(f"Found {len(enrollments)} enrollments for these courses")
        
        # Create a lookup map for enrollments by (userId, courseId)
        enrollment_map = {
            (enroll["userId"], enroll["courseId"]): enroll
            for enroll in enrollments
        }
        
        # Query ALL attendances for these courses (not just from sessions in last 24 hours)
        # We need to check all attendances to determine the correct location
        attendances_query = """
        query GetAttendances($courseIds: [Int!]!) {
            Attendance(
                where: {
                    Session: {
                        courseId: {_in: $courseIds}
                    }
                }
            ) {
                id
                userId
                sessionId
                source
                location
                Session {
                    courseId
                }
            }
        }
        """
        
        attendances_result = eduhub_client.send_query(
            attendances_query,
            {"courseIds": course_ids}
        )
        
        if attendances_result.get("data") is None:
            error_msg = f"Failed to query attendances: {attendances_result}"
            logging.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }
        
        attendances = attendances_result["data"]["Attendance"]
        logging.info(f"Found {len(attendances)} total attendances for these courses")
        
        # Group attendances by (userId, courseId)
        # Key: (userId, courseId), Value: list of attendances
        attendance_by_user_course = {}
        
        for attendance in attendances:
            user_id = attendance["userId"]
            course_id = attendance["Session"]["courseId"]
            key = (user_id, course_id)
            
            if key not in attendance_by_user_course:
                attendance_by_user_course[key] = []
            attendance_by_user_course[key].append(attendance)
        
        # Determine location for each (userId, courseId) pair
        updates = []
        enrollments_updated = 0
        
        for (user_id, course_id), user_attendances in attendance_by_user_course.items():
            # Check if there's any LIMESURVEY attendance
            limesurvey_attendances = [
                a for a in user_attendances 
                if a["source"] == "LIMESURVEY" and a.get("location")
            ]
            
            if limesurvey_attendances:
                # Use the location from LIMESURVEY attendance (raw Place value)
                # Map from LimeSurvey Place values to LocationOption values
                raw_location = limesurvey_attendances[0]["location"]
                location = LIMESURVEY_LOCATION_MAPPING.get(raw_location, None)
                
                if location is None:
                    logging.warning(
                        f"User {user_id} in course {course_id}: "
                        f"Unknown LimeSurvey location '{raw_location}', skipping"
                    )
                    continue
                
                logging.debug(
                    f"User {user_id} in course {course_id}: "
                    f"Has LIMESURVEY attendance with location '{raw_location}', "
                    f"mapped to {location}"
                )
            else:
                # Check if there are any ZOOM attendances
                zoom_attendances = [
                    a for a in user_attendances 
                    if a["source"] == "ZOOM"
                ]
                
                if zoom_attendances:
                    # Map ZOOM to ONLINE for CourseEnrollment.location
                    location = "ONLINE"
                    logging.debug(
                        f"User {user_id} in course {course_id}: "
                        f"Only ZOOM attendance, setting location to ONLINE"
                    )
                else:
                    # No attendances or unknown source, skip
                    logging.debug(
                        f"User {user_id} in course {course_id}: "
                        f"No valid attendances found, skipping"
                    )
                    continue
            
            # Find the enrollment
            enrollment = enrollment_map.get((user_id, course_id))
            
            if not enrollment:
                logging.warning(
                    f"Enrollment not found for user {user_id} in course {course_id}"
                )
                continue
            
            # Check if location needs to be updated
            current_location = enrollment.get("location")
            if current_location == location:
                logging.debug(
                    f"Enrollment {enrollment['id']} already has location {location}, skipping"
                )
                continue
            
            updates.append({
                "enrollment_id": enrollment["id"],
                "user_id": user_id,
                "course_id": course_id,
                "location": location
            })
        
        logging.info(f"Found {len(updates)} enrollments to update")
        
        # Update enrollments
        for update in updates:
            update_mutation = """
            mutation UpdateEnrollmentLocation($enrollmentId: Int!, $location: String!) {
                update_CourseEnrollment(
                    where: { id: { _eq: $enrollmentId } },
                    _set: { location: $location }
                ) {
                    affected_rows
                    returning {
                        id
                        userId
                        courseId
                        location
                    }
                }
            }
            """
            
            result = eduhub_client.send_query(
                update_mutation,
                {
                    "enrollmentId": update["enrollment_id"],
                    "location": update["location"]
                }
            )
            
            if result.get("data") and result["data"].get("update_CourseEnrollment"):
                affected_rows = result["data"]["update_CourseEnrollment"]["affected_rows"]
                if affected_rows > 0:
                    enrollments_updated += 1
                    logging.info(
                        f"Updated enrollment {update['enrollment_id']} "
                        f"(user {update['user_id']}, course {update['course_id']}) "
                        f"to location {update['location']}"
                    )
                else:
                    logging.warning(
                        f"No rows affected for enrollment {update['enrollment_id']}"
                    )
            else:
                error_msg = f"Failed to update enrollment {update['enrollment_id']}: {result}"
                logging.error(error_msg)
        
        return {
            "success": True,
            "data": {
                "sessions_processed": len(sessions),
                "courses_processed": len(course_ids),
                "enrollments_found": len(enrollments),
                "attendances_found": len(attendances),
                "enrollments_updated": enrollments_updated,
                "message": f"Successfully updated {enrollments_updated} enrollments"
            }
        }
        
    except Exception as e:
        logging.exception("Error updating enrollment locations: %s", e)
        return {
            "success": False,
            "error": str(e)
        }

