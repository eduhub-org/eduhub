"""Numeric helpers shared by the python cloud functions.

Lives inside ``api_clients`` because the release workflow
(.github/workflows/zip-and-store-cloud-functions.yml) copies exactly
``shared_libs/api_clients`` into each python function bundle - a module placed
anywhere else in ``shared_libs`` works locally and raises ImportError in
production.
"""


def safe_float_convert(value):
    """
    Safely convert a value to float, handling both comma and period decimal separators.
    This is needed for ECTS values that may use German decimal format (comma instead of period).

    Args:
        value: The value to convert (string or numeric)

    Returns:
        float or None: The converted float value, or None if value is invalid/empty/NONE
    """
    # Handle None values
    if value is None:
        return None

    # Handle empty strings
    if isinstance(value, str) and value.strip() == "":
        return None

    # Handle "NONE" string (case-insensitive)
    if isinstance(value, str) and value.strip().upper() == "NONE":
        return None

    # Convert valid numeric strings and numbers
    try:
        if isinstance(value, str):
            return float(value.replace(",", "."))
        else:
            return float(value)
    except (ValueError, TypeError):
        # Return None for any conversion failures instead of raising
        return None
