"""
Security Handler for EduHub Participant Data API
Provides comprehensive security features including rate limiting, audit logging, and validation
"""

import os
import json
import logging
import hashlib
import hmac
import time
import re
import ipaddress
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass
from enum import Enum
import secrets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SecurityLevel(Enum):
    """Security levels for different organization types"""
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


@dataclass
class RateLimitConfig:
    """Rate limiting configuration per security level"""
    requests_per_hour: int
    requests_per_minute: int
    burst_limit: int
    window_size: int = 3600  # 1 hour in seconds


@dataclass
class IPRestrictionConfig:
    """IP restriction configuration for organizations"""
    enabled: bool = False
    allowed_ips: Set[str] = None
    allowed_cidrs: Set[str] = None
    allow_private_ips: bool = True
    allow_cloud_providers: bool = True
    strict_mode: bool = False  # If True, blocks all IPs not explicitly allowed


class SecurityHandler:
    """Comprehensive security handler for the participant data API"""
    
    def __init__(self):
        # Rate limiting storage (in production, use Redis or database)
        self.rate_limit_store = {}
        self.audit_log = []
        
        # Security configurations
        self.rate_limits = {
            SecurityLevel.BASIC: RateLimitConfig(100, 10, 20),
            SecurityLevel.STANDARD: RateLimitConfig(500, 50, 100),
            SecurityLevel.PREMIUM: RateLimitConfig(2000, 200, 500),
            SecurityLevel.ENTERPRISE: RateLimitConfig(10000, 1000, 2000)
        }
        
        # IP restriction configurations by organization
        self.ip_restrictions = {}
        
        # Cloud provider IP ranges (common ones)
        self.cloud_provider_ranges = {
            'aws': [
                '3.5.140.0/22', '18.130.0.0/16', '18.168.0.0/14', '18.200.0.0/16',
                '35.176.0.0/13', '35.184.0.0/13', '52.0.0.0/8', '54.0.0.0/8'
            ],
            'azure': [
                '13.64.0.0/11', '13.104.0.0/14', '20.36.0.0/14', '20.40.0.0/13',
                '20.48.0.0/12', '20.64.0.0/10', '40.64.0.0/10', '51.104.0.0/15'
            ],
            'gcp': [
                '8.8.8.0/24', '8.34.208.0/20', '8.35.192.0/20', '8.8.4.0/24',
                '34.64.0.0/10', '35.184.0.0/13', '35.192.0.0/14', '35.196.0.0/15'
            ]
        }
        
        # Suspicious activity patterns
        self.suspicious_patterns = [
            r'(\d{1,3}\.){3}\d{1,3}',  # IP addresses in requests
            r'<script',  # XSS attempts
            r'javascript:',  # JavaScript injection
            r'union\s+select',  # SQL injection attempts
            r'exec\s*\('  # Command injection
        ]
        
        # Compile patterns for efficiency
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.suspicious_patterns]
    
    def configure_ip_restrictions(self, organization_id: int, config: IPRestrictionConfig):
        """
        Configure IP restrictions for an organization
        """
        self.ip_restrictions[organization_id] = config
        logger.info(f"IP restrictions configured for organization {organization_id}: {config}")
    
    def validate_ip_address(self, client_ip: str, organization_id: int) -> Tuple[bool, str]:
        """
        Validate if client IP is allowed for the organization
        Returns (is_allowed, reason)
        """
        # Get IP restriction config for organization
        config = self.ip_restrictions.get(organization_id)
        if not config or not config.enabled:
            return True, "IP restrictions not enabled"
        
        try:
            # Parse the client IP
            ip_obj = ipaddress.ip_address(client_ip)
            
            # Check if it's a private IP
            if ip_obj.is_private:
                if config.allow_private_ips:
                    return True, "Private IP allowed"
                else:
                    return False, "Private IPs not allowed"
            
            # Check explicit IP whitelist
            if config.allowed_ips and client_ip in config.allowed_ips:
                return True, "IP in whitelist"
            
            # Check CIDR ranges
            if config.allowed_cidrs:
                for cidr in config.allowed_cidrs:
                    try:
                        network = ipaddress.ip_network(cidr, strict=False)
                        if ip_obj in network:
                            return True, f"IP in allowed CIDR: {cidr}"
                    except ValueError:
                        logger.warning(f"Invalid CIDR range: {cidr}")
            
            # Check cloud provider ranges
            if config.allow_cloud_providers:
                for provider, ranges in self.cloud_provider_ranges.items():
                    for cidr in ranges:
                        try:
                            network = ipaddress.ip_network(cidr, strict=False)
                            if ip_obj in network:
                                return True, f"IP in {provider} range: {cidr}"
                        except ValueError:
                            continue
            
            # If strict mode is enabled, block all non-whitelisted IPs
            if config.strict_mode:
                return False, "IP not in whitelist (strict mode enabled)"
            
            # Default: allow if not in strict mode
            return True, "IP allowed (non-strict mode)"
            
        except ValueError:
            return False, "Invalid IP address format"
        except Exception as e:
            logger.error(f"Error validating IP {client_ip}: {str(e)}")
            return False, "IP validation error"
    
    def validate_request(self, request) -> Tuple[bool, List[str]]:
        """
        Comprehensive request validation
        Returns (is_valid, list_of_violations)
        """
        violations = []
        
        # Check for required headers
        required_headers = ['X-API-Key', 'User-Agent']
        for header in required_headers:
            if not request.headers.get(header):
                violations.append(f"Missing required header: {header}")
        
        # Validate User-Agent
        user_agent = request.headers.get('User-Agent', '')
        if not user_agent or len(user_agent) < 10:
            violations.append("Invalid or missing User-Agent")
        
        # Check for suspicious patterns in request
        request_data = {
            'path': request.path,
            'query_string': request.query_string.decode('utf-8'),
            'headers': dict(request.headers),
            'method': request.method
        }
        
        request_str = json.dumps(request_data, sort_keys=True)
        for pattern in self.compiled_patterns:
            if pattern.search(request_str):
                violations.append(f"Suspicious pattern detected: {pattern.pattern}")
        
        # Validate request size
        content_length = request.headers.get('Content-Length', 0)
        if content_length and int(content_length) > 1024 * 1024:  # 1MB limit
            violations.append("Request too large")
        
        # Validate HTTP method
        allowed_methods = ['GET', 'POST', 'OPTIONS']
        if request.method not in allowed_methods:
            violations.append(f"Method not allowed: {request.method}")
        
        return len(violations) == 0, violations
    
    def check_rate_limit(self, organization_id: int, security_level: SecurityLevel, 
                        client_ip: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Enhanced rate limiting with per-organization and per-IP limits
        Returns (allowed, rate_limit_info)
        """
        config = self.rate_limits[security_level]
        current_time = time.time()
        
        # Create rate limit keys
        org_key = f"org_{organization_id}"
        ip_key = f"ip_{client_ip}"
        combined_key = f"combined_{organization_id}_{client_ip}"
        
        # Check organization-level rate limit
        org_allowed, org_info = self._check_single_rate_limit(
            org_key, config, current_time
        )
        
        # Check IP-level rate limit (more restrictive)
        ip_config = RateLimitConfig(
            config.requests_per_hour // 2,  # Half the org limit
            config.requests_per_minute // 2,
            config.burst_limit // 2
        )
        ip_allowed, ip_info = self._check_single_rate_limit(
            ip_key, ip_config, current_time
        )
        
        # Check combined limit (burst protection)
        combined_allowed, combined_info = self._check_single_rate_limit(
            combined_key, 
            RateLimitConfig(config.burst_limit, config.burst_limit, config.burst_limit),
            current_time
        )
        
        # All checks must pass
        allowed = org_allowed and ip_allowed and combined_allowed
        
        rate_limit_info = {
            'allowed': allowed,
            'organization_limit': org_info,
            'ip_limit': ip_info,
            'burst_limit': combined_info,
            'reset_time': current_time + config.window_size
        }
        
        return allowed, rate_limit_info
    
    def _check_single_rate_limit(self, key: str, config: RateLimitConfig, 
                                current_time: float) -> Tuple[bool, Dict[str, Any]]:
        """Check rate limit for a single key"""
        if key not in self.rate_limit_store:
            self.rate_limit_store[key] = {
                'hourly': {'count': 0, 'window_start': current_time},
                'minute': {'count': 0, 'window_start': current_time},
                'burst': {'count': 0, 'window_start': current_time}
            }
        
        store = self.rate_limit_store[key]
        
        # Check hourly limit
        if current_time - store['hourly']['window_start'] > config.window_size:
            store['hourly'] = {'count': 1, 'window_start': current_time}
        elif store['hourly']['count'] >= config.requests_per_hour:
            return False, {'limit_type': 'hourly', 'limit': config.requests_per_hour}
        else:
            store['hourly']['count'] += 1
        
        # Check minute limit
        if current_time - store['minute']['window_start'] > 60:
            store['minute'] = {'count': 1, 'window_start': current_time}
        elif store['minute']['count'] >= config.requests_per_minute:
            return False, {'limit_type': 'minute', 'limit': config.requests_per_minute}
        else:
            store['minute']['count'] += 1
        
        # Check burst limit
        if current_time - store['burst']['window_start'] > 10:  # 10 second window
            store['burst'] = {'count': 1, 'window_start': current_time}
        elif store['burst']['count'] >= config.burst_limit:
            return False, {'limit_type': 'burst', 'limit': config.burst_limit}
        else:
            store['burst']['count'] += 1
        
        return True, {'remaining': 'unlimited'}
    
    def log_audit_event(self, event_type: str, organization_id: int, 
                       client_ip: str, request_data: Dict[str, Any], 
                       success: bool, details: Optional[str] = None):
        """
        Comprehensive audit logging for security and compliance
        """
        audit_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'organization_id': organization_id,
            'client_ip': client_ip,
            'user_agent': request_data.get('headers', {}).get('User-Agent', ''),
            'request_path': request_data.get('path', ''),
            'request_method': request_data.get('method', ''),
            'success': success,
            'details': details,
            'session_id': self._generate_session_id(organization_id, client_ip)
        }
        
        # Add to audit log
        self.audit_log.append(audit_entry)
        
        # Log to system logger
        log_level = logging.INFO if success else logging.WARNING
        logger.log(log_level, f"AUDIT: {json.dumps(audit_entry)}")
        
        # In production, send to external logging service
        self._send_to_external_logging(audit_entry)
    
    def _generate_session_id(self, organization_id: int, client_ip: str) -> str:
        """Generate a session ID for tracking related requests"""
        data = f"{organization_id}:{client_ip}:{int(time.time() / 300)}"  # 5-minute windows
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def _send_to_external_logging(self, audit_entry: Dict[str, Any]):
        """Send audit entries to external logging service (placeholder)"""
        # In production, implement:
        # - Cloud Logging (GCP)
        # - Splunk
        # - ELK Stack
        # - Security Information and Event Management (SIEM)
        pass
    
    def detect_anomalies(self, organization_id: int, client_ip: str, 
                        request_data: Dict[str, Any]) -> List[str]:
        """
        Detect suspicious or anomalous behavior
        Returns list of detected anomalies
        """
        anomalies = []
        
        # Check for unusual access patterns
        recent_requests = self._get_recent_requests(organization_id, client_ip)
        
        # High frequency requests
        if len(recent_requests) > 50:  # More than 50 requests in recent window
            anomalies.append("High frequency requests detected")
        
        # Unusual time patterns (outside business hours)
        current_hour = datetime.utcnow().hour
        if current_hour < 6 or current_hour > 22:  # Outside 6 AM - 10 PM UTC
            anomalies.append("Access outside normal business hours")
        
        # Multiple failed attempts
        failed_attempts = [r for r in recent_requests if not r.get('success', True)]
        if len(failed_attempts) > 5:
            anomalies.append("Multiple failed authentication attempts")
        
        # Geographic anomalies (if IP geolocation is available)
        # This would require IP geolocation service integration
        
        return anomalies
    
    def _get_recent_requests(self, organization_id: int, client_ip: str, 
                           window_minutes: int = 60) -> List[Dict[str, Any]]:
        """Get recent requests for anomaly detection"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=window_minutes)
        return [
            entry for entry in self.audit_log
            if (entry['organization_id'] == organization_id and 
                entry['client_ip'] == client_ip and
                datetime.fromisoformat(entry['timestamp']) > cutoff_time)
        ]
    
    def sanitize_response_data(self, data: Dict[str, Any], 
                             security_level: SecurityLevel) -> Dict[str, Any]:
        """
        Sanitize response data based on security level
        """
        sanitized = data.copy()
        
        # Remove sensitive fields for lower security levels
        if security_level == SecurityLevel.BASIC:
            sensitive_fields = ['email', 'phone', 'address', 'personal_data']
            for field in sensitive_fields:
                if field in sanitized:
                    del sanitized[field]
        
        # Add security headers
        sanitized['_security'] = {
            'level': security_level.value,
            'timestamp': datetime.utcnow().isoformat(),
            'data_retention': '24h'
        }
        
        return sanitized
    
    def generate_security_headers(self, rate_limit_info: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate security headers for response
        """
        headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'X-Rate-Limit-Remaining': str(rate_limit_info.get('remaining', 'unknown')),
            'X-Rate-Limit-Reset': str(rate_limit_info.get('reset_time', '')),
            'X-Security-Level': 'participant-data-api'
        }
        
        return headers


# Global security handler instance
security_handler = SecurityHandler()


def get_security_level_for_organization(organization_type: str) -> SecurityLevel:
    """
    Determine security level based on organization type
    """
    security_mapping = {
        'university': SecurityLevel.PREMIUM,
        'company': SecurityLevel.STANDARD,
        'government': SecurityLevel.ENTERPRISE,
        'non_profit': SecurityLevel.BASIC,
        'research': SecurityLevel.PREMIUM
    }
    
    return security_mapping.get(organization_type, SecurityLevel.BASIC)


def validate_and_sanitize_input(data: Any, field_type: str) -> Tuple[bool, Any]:
    """
    Validate and sanitize input data
    """
    if field_type == 'course_id':
        if not isinstance(data, (int, str)):
            return False, None
        try:
            course_id = int(data)
            if course_id <= 0:
                return False, None
            return True, course_id
        except (ValueError, TypeError):
            return False, None
    
    elif field_type == 'organization_id':
        if not isinstance(data, (int, str)):
            return False, None
        try:
            org_id = int(data)
            if org_id <= 0:
                return False, None
            return True, org_id
        except (ValueError, TypeError):
            return False, None
    
    elif field_type == 'api_key':
        if not isinstance(data, str):
            return False, None
        # Validate API key format
        if not data.startswith('edh_live_org'):
            return False, None
        if len(data) < 30 or len(data) > 100:
            return False, None
        return True, data.strip()
    
    return True, data 