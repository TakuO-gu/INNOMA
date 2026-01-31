/**
 * Input validation helpers for route params.
 */

const MUNICIPALITY_ID_PATTERN = /^[a-z0-9-]+$/;
const SERVICE_ID_PATTERN = /^[a-z0-9-]+$/;
const VARIABLE_NAME_PATTERN = /^[a-z0-9_]+$/;

function isSafeSegment(value: string): boolean {
  return !value.includes("..") && !value.includes("/") && !value.includes("\\");
}

export function isValidMunicipalityId(value: string): boolean {
  return isSafeSegment(value) && MUNICIPALITY_ID_PATTERN.test(value);
}

export function isValidServiceId(value: string): boolean {
  return isSafeSegment(value) && SERVICE_ID_PATTERN.test(value);
}

export function isValidVariableName(value: string): boolean {
  return isSafeSegment(value) && VARIABLE_NAME_PATTERN.test(value);
}
