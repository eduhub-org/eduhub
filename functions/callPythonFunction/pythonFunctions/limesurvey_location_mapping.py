"""Shared mapping utilities for LimeSurvey Place values."""

from typing import List


LIMESURVEY_LOCATION_MAPPING = {
    "Starterkitchen": "KIEL",
    "Legienstraße 40": "KIEL",
    "Waterkant": "KIEL",
    "Kosmos": "KIEL",
    "KIEL": "KIEL",
    "HEIDE": "HEIDE",
    "H04": "HEIDE",
}


def place_keys_for_location_option(location_option: str) -> List[str]:
    """Return all raw Place keys that map to a location option."""
    if not location_option:
        return []

    return [
        place
        for place, mapped_location in LIMESURVEY_LOCATION_MAPPING.items()
        if mapped_location == location_option
    ]
