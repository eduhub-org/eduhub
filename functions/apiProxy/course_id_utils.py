"""
Course ID Utilities for API Proxy

Shared utilities for generating consistent UUID v5 hash IDs from course identifiers.
Used by both MOOCHub API and Participant API to ensure consistent course identification.
"""

import uuid


# Fixed namespace UUID for generating consistent course hash IDs
# This ensures the same course-location combination always generates the same UUID
COURSE_ID_NAMESPACE = uuid.UUID('fb7eec39-2d36-4c2f-a6b7-87568c8976b2')


def generate_uuid_from_id(id_str):
    """
    Generate a consistent UUID v5 from a string ID using a fixed namespace.
    
    Low-level utility function for generating UUIDs from any string identifier.
    For course-specific hash IDs, use generate_course_hash_id() instead.
    
    Args:
        id_str: String identifier (e.g., "123-456" for course_id-location_id)
        
    Returns:
        str: UUID v5 string representation
        
    Example:
        >>> generate_uuid_from_id("123-456")
        '8978f51e-770c-4d0a-a2e3-23fae8f6aa79'
    """
    return str(uuid.uuid5(COURSE_ID_NAMESPACE, str(id_str)))


def generate_course_hash_id(course_id, location_id=None):
    """
    Generate a UUID v5 hash ID for a course, optionally including location.
    
    This is the standard way to generate course hash IDs used by both
    MOOCHub API and Participant API. The format matches MOOCHub requirements:
    - With location: "{course_id}-{location_id}"
    - Without location: "{course_id}" (fallback)
    
    Args:
        course_id: Course ID (integer or string)
        location_id: Optional location ID (integer or string). If None, 
                     generates hash from course_id only.
        
    Returns:
        str: UUID v5 string representation
        
    Examples:
        >>> generate_course_hash_id(123, 456)
        '744b5f46-23f8-5b4f-a17f-a3ce993212ce'
        
        >>> generate_course_hash_id(123)
        '8978f51e-770c-4d0a-a2e3-23fae8f6aa79'
    """
    if location_id is not None:
        id_str = f"{course_id}-{location_id}"
    else:
        id_str = str(course_id)
    return generate_uuid_from_id(id_str)

