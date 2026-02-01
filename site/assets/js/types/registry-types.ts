// All 38 official PURL types from purl-spec
export type PurlType =
  | 'alpm' | 'apk' | 'bazel' | 'bitbucket' | 'bitnami'
  | 'cargo' | 'cocoapods' | 'composer' | 'conan' | 'conda'
  | 'cpan' | 'cran' | 'deb' | 'docker' | 'gem'
  | 'generic' | 'github' | 'golang' | 'hackage' | 'hex'
  | 'huggingface' | 'julia' | 'luarocks' | 'maven' | 'mlflow'
  | 'npm' | 'nuget' | 'oci' | 'opam' | 'otp'
  | 'pub' | 'pypi' | 'qpkg' | 'rpm' | 'swid'
  | 'swift' | 'vscode-extension' | 'yocto';

// List of all valid PURL types for validation
export const VALID_PURL_TYPES: readonly PurlType[] = [
  'alpm', 'apk', 'bazel', 'bitbucket', 'bitnami',
  'cargo', 'cocoapods', 'composer', 'conan', 'conda',
  'cpan', 'cran', 'deb', 'docker', 'gem',
  'generic', 'github', 'golang', 'hackage', 'hex',
  'huggingface', 'julia', 'luarocks', 'maven', 'mlflow',
  'npm', 'nuget', 'oci', 'opam', 'otp',
  'pub', 'pypi', 'qpkg', 'rpm', 'swid',
  'swift', 'vscode-extension', 'yocto'
] as const;

// Parsed PURL structure (mirrors packageurl-js output)
export interface PackageURL {
  type: string;
  namespace?: string;
  name: string;
  version?: string;
  qualifiers?: Record<string, string>;
  subpath?: string;
}

// Error codes for parse failures
export type ErrorCode =
  | 'INVALID_FORMAT'
  | 'MISSING_TYPE'
  | 'MISSING_NAME'
  | 'UNKNOWN_TYPE'
  | 'INVALID_COMPONENT';

// Parse error details
export interface ParseError {
  code: ErrorCode;
  message: string;
}

// Result of parsing a PURL string
export type ParseResult =
  | { success: true; purl: PackageURL }
  | { success: false; error: ParseError };

// Registry mapping for a PURL type
export interface RegistryMapping {
  type: PurlType;
  registryName: string;
  baseUrl: string | null;
  hasRegistry: boolean;
  requiresQualifier?: boolean;
}

// Result of registry URL generation
export interface RegistryResult {
  url: string | null;
  registryName: string;
  hasRegistry: boolean;
  message?: string;
}

// UI state
export interface ViewState {
  inputValue: string;
  parseResult: ParseResult | null;
  registryResult: RegistryResult | null;
}
