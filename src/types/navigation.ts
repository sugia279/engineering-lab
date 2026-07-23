/**
 * Navigation contracts for site navigation, breadcrumbs, and pagination.
 */

/** A single navigation item — primary nav, collection nav, or footer links. */
export interface NavigationItem {
  readonly label: string;
  readonly href: string;
  readonly matchPattern?: string;
  readonly external?: boolean;
}

/** Breadcrumb for a single ancestor or current page. */
export interface Breadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
}

/** Pagination state for listing pages. */
export interface PaginationData {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly currentUrl: string;
  readonly previousUrl?: string;
  readonly nextUrl?: string;
  readonly pageUrls: readonly string[];
}
