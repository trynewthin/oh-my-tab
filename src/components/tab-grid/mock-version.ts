// Bump this whenever mock-data.ts changes so development rebuilds reseed the
// persisted grid. It lives in its own module so production builds can import
// the version without pulling the 200-line mock item list into the bundle.
export const MOCK_DATA_VERSION = 2
