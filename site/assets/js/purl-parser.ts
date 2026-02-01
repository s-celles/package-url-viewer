import { PackageURL as PurlJS } from 'packageurl-js';
import type { PackageURL, ParseResult, ParseError, ErrorCode } from './types/registry-types';
import { VALID_PURL_TYPES } from './types/registry-types';

/**
 * Create a ParseError with the given code and message
 */
function createError(code: ErrorCode, message: string): ParseError {
  return { code, message };
}

/**
 * Check if a type is a valid PURL type
 */
export function isValidPurlType(type: string): boolean {
  return VALID_PURL_TYPES.includes(type as any);
}

/**
 * Get a user-friendly error message for a given error code
 */
export function getErrorMessage(code: ErrorCode, details?: string): string {
  switch (code) {
    case 'INVALID_FORMAT':
      return 'Invalid PURL format. A valid PURL must start with "pkg:" followed by type/name (e.g., pkg:npm/lodash).';
    case 'MISSING_TYPE':
      return 'Missing package type. The PURL must include a type after "pkg:" (e.g., pkg:npm/lodash).';
    case 'MISSING_NAME':
      return 'Missing package name. The PURL must include a package name (e.g., pkg:npm/lodash).';
    case 'UNKNOWN_TYPE':
      return `Unknown package type "${details}". This type is not recognized in the official PURL specification.`;
    case 'INVALID_COMPONENT':
      return `Invalid PURL component: ${details || 'The PURL contains invalid characters or structure.'}`;
    default:
      return 'An unknown error occurred while parsing the PURL.';
  }
}

/**
 * Parse a PURL string and return a ParseResult
 */
export function parsePurl(input: string): ParseResult {
  // Trim whitespace
  const trimmed = input.trim();

  // Check for empty input
  if (!trimmed) {
    return {
      success: false,
      error: createError('INVALID_FORMAT', getErrorMessage('INVALID_FORMAT'))
    };
  }

  // Check basic format (must start with pkg:)
  if (!trimmed.startsWith('pkg:')) {
    return {
      success: false,
      error: createError('INVALID_FORMAT', getErrorMessage('INVALID_FORMAT'))
    };
  }

  try {
    // Use packageurl-js to parse
    const parsed = PurlJS.fromString(trimmed);

    // Check if type is valid
    if (!isValidPurlType(parsed.type)) {
      return {
        success: false,
        error: createError('UNKNOWN_TYPE', getErrorMessage('UNKNOWN_TYPE', parsed.type))
      };
    }

    // Convert to our PackageURL interface
    const purl: PackageURL = {
      type: parsed.type,
      name: parsed.name,
      ...(parsed.namespace && { namespace: parsed.namespace }),
      ...(parsed.version && { version: parsed.version }),
      ...(parsed.qualifiers && Object.keys(parsed.qualifiers).length > 0 && { qualifiers: parsed.qualifiers }),
      ...(parsed.subpath && { subpath: parsed.subpath })
    };

    return { success: true, purl };
  } catch (err) {
    // Determine error type from packageurl-js error message
    const message = err instanceof Error ? err.message : String(err);

    if (message.toLowerCase().includes('type')) {
      return {
        success: false,
        error: createError('MISSING_TYPE', getErrorMessage('MISSING_TYPE'))
      };
    }

    if (message.toLowerCase().includes('name')) {
      return {
        success: false,
        error: createError('MISSING_NAME', getErrorMessage('MISSING_NAME'))
      };
    }

    return {
      success: false,
      error: createError('INVALID_COMPONENT', getErrorMessage('INVALID_COMPONENT', message))
    };
  }
}
