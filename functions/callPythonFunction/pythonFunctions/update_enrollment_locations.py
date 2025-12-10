import logging
from datetime import datetime, timedelta, timezone
from api_clients import EduHubClient

# Mapping from LimeSurvey Place values to LocationOption values
# Fallback for unknown locations is "KIEL"
LIMESURVEY_LOCATION_MAPPING = {
    "Starterkitchen": "KIEL",
    "Legienstraße 40": "KIEL",
    "Waterkant": "KIEL",
    "Kosmos": "KIEL",
    "KIEL": "KIEL",
    "SK": "KIEL",
    "L40": "KIEL",
    "FABLAB": "KIEL",
    "HEIDE": "HEIDE",
}


def update_enrollment_locations(arguments):
    """
    Updates CourseEnrollment.location based on attendance data.
    Priority: LimeSurvey location > ONLINE (default)
    
    Logic:
    - If enrollment location is NULL and there are attendances → default to "ONLINE"
    - If participant has LIMESURVEY attendances → override with LIMESURVEY location (KIEL, HEIDE)
    - Unknown LimeSurvey locations default to "KIEL"
    
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
        
        logging.info(f"Querying attendances created/updated after {time_threshold}")
        
        # Query attendances created or updated in the last 24 hours
        # This ensures we process courses even if sessions ended earlier
        recent_attendances_query = """
        query GetRecentAttendances($timeThreshold: timestamptz!) {
            Attendance(
                where: {
                    _or: [
                        { created_at: { _gte: $timeThreshold } },
                        { updated_at: { _gte: $timeThreshold } }
                    ]
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
        
        recent_attendances_result = eduhub_client.send_query(
            recent_attendances_query,
            {"timeThreshold": time_threshold}
        )
        
        if recent_attendances_result.get("data") is None:
            error_msg = f"Failed to query recent attendances: {recent_attendances_result}"
            logging.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }
        
        recent_attendances = recent_attendances_result["data"]["Attendance"]
        logging.info(f"Found {len(recent_attendances)} attendances created/updated in the last 24 hours")
        
        if len(recent_attendances) == 0:
            return {
                "success": True,
                "data": {
                    "recent_attendances_processed": 0,
                    "enrollments_updated": 0,
                    "message": "No recent attendances found in the last 24 hours"
                }
            }
        
        # Collect unique course IDs from recent attendances
        course_ids = list({
            attendance["Session"]["courseId"] 
            for attendance in recent_attendances 
            if attendance.get("Session") and attendance["Session"].get("courseId")
        })
        
        logging.info(f"Found {len(course_ids)} unique courses with recent attendances")
        
        if len(course_ids) == 0:
            return {
                "success": True,
                "data": {
                    "recent_attendances_processed": len(recent_attendances),
                    "enrollments_updated": 0,
                    "message": "No courses found from recent attendances"
                }
            }
        
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
        # Order by id ascending so we can process oldest first, newest last (newest overwrites)
        attendances_query = """
        query GetAttendances($courseIds: [Int!]!) {
            Attendance(
                where: {
                    Session: {
                        courseId: {_in: $courseIds}
                    }
                }
                order_by: {id: asc}
            ) {
                id
                userId
                sessionId
                source
                location
                created_at
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
            # Find the enrollment first
            enrollment = enrollment_map.get((user_id, course_id))
            
            if not enrollment:
                logging.warning(
                    f"Enrollment not found for user {user_id} in course {course_id}"
                )
                continue
            
            current_location = enrollment.get("location")
            
            # Start with default: if location is NULL, set to ONLINE (default for any attendance)
            if current_location is None:
                location = "ONLINE"
                logging.debug(
                    f"User {user_id} in course {course_id}: "
                    f"Enrollment location is NULL, defaulting to ONLINE"
                )
            else:
                location = current_location  # Keep current location as starting point
            
            # Check if there's any LIMESURVEY attendance - if so, override with LIMESURVEY location
            # Process in ascending ID order so the most recent (highest ID) overwrites any previous values
            limesurvey_attendances = [
                a for a in user_attendances 
                if a["source"] == "LIMESURVEY" and a.get("location")
            ]
            
            if limesurvey_attendances:
                # Sort by id ascending so we process oldest first, newest last
                # The last one processed (highest ID = most recent) will be the final value
                limesurvey_attendances.sort(key=lambda x: x.get("id", 0), reverse=False)
                
                # Iterate through all LIMESURVEY attendances, letting each overwrite
                # The last one (highest ID = most recent) will be the final location
                for attendance in limesurvey_attendances:
                    raw_location = attendance["location"]
                    location = LIMESURVEY_LOCATION_MAPPING.get(raw_location, "KIEL")  # Default to KIEL for unknown locations
                
                    if raw_location not in LIMESURVEY_LOCATION_MAPPING:
                        logging.debug(
                            f"User {user_id} in course {course_id}: "
                            f"Unknown LimeSurvey location '{raw_location}' (ID: {attendance.get('id')}), using default KIEL"
                        )
                    else:
                        logging.debug(
                            f"User {user_id} in course {course_id}: "
                            f"Processing LIMESURVEY attendance with location '{raw_location}' (ID: {attendance.get('id')}), "
                            f"mapped to {location}"
                        )
                
                # Log which location was finally selected (from the most recent attendance)
                if len(limesurvey_attendances) > 1:
                    final_attendance = limesurvey_attendances[-1]
                    logging.info(
                        f"User {user_id} in course {course_id}: "
                        f"Multiple LIMESURVEY attendances found ({len(limesurvey_attendances)}), "
                        f"using most recent (ID: {final_attendance.get('id')}) with location '{final_attendance.get('location')}' -> {location}"
                    )
            
            # Check if location needs to be updated
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
                "recent_attendances_processed": len(recent_attendances),
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

