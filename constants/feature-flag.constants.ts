export const FEATURE_FLAG_NAME_MAX_LENGTH = 100;
export const FEATURE_FLAG_DESCRIPTION_MAX_LENGTH = 500;
export const FEATURE_FLAG_KEY_MAX_LENGTH = 50;

export enum FEATURE_FLAG_STATUS {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

export enum FEATURE_FLAG_VALUES {
  TRUE = "true",
  FALSE = "false",
}

export enum FEATURE_FLAG_OPERATORS {
  EQUALS = "equals",
  NOT_EQUALS = "not_equals",
  CONTAINS = "contains",
  NOT_CONTAINS = "not_contains",
  IN = "in",
  NOT_IN = "not_in",
  GREATER_THAN = "greater_than",
  LESS_THAN = "less_than",
  GREATER_THAN_OR_EQUAL = "greater_than_or_equal",
  LESS_THAN_OR_EQUAL = "less_than_or_equal",
  STARTS_WITH = "starts_with",
  ENDS_WITH = "ends_with",
}
