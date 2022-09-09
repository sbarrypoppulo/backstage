/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Entity } from '@backstage/catalog-model';

/**
 * A filter expression for entities.
 *
 * Any (at least one) of the outer sets must match, within which all of the
 * individual filters must match.
 * @public
 */
export type EntityFilter =
  | { allOf: EntityFilter[] }
  | { anyOf: EntityFilter[] }
  | { not: EntityFilter }
  | EntitiesSearchFilter;

/**
 * A pagination rule for entities.
 */
export type EntityPagination = {
  limit?: number;
  offset?: number;
  after?: string;
};

/**
 * A sorting rule for entities.
 */
export type EntitySortField = {
  field: string;
  order?: 'asc' | 'desc' | undefined;
};

/**
 * Matches rows in the search table.
 * @public
 */
export type EntitiesSearchFilter = {
  /**
   * The key to match on.
   *
   * Matches are always case insensitive.
   */
  key: string;

  /**
   * Match on plain equality of values.
   *
   * Match on values that are equal to any of the given array items. Matches are
   * always case insensitive.
   */
  values?: string[];
};

export type PageInfo =
  | {
      hasNextPage: false;
    }
  | {
      hasNextPage: true;
      endCursor: string;
    };

export type EntitiesRequest = {
  filter?: EntityFilter;
  fields?: (entity: Entity) => Entity;
  pagination?: EntityPagination;
  authorizationToken?: string;
};

export type EntitiesResponse = {
  entities: Entity[];
  pageInfo: PageInfo;
};

export type EntityAncestryResponse = {
  rootEntityRef: string;
  items: Array<{
    entity: Entity;
    parentEntityRefs: string[];
  }>;
};

/**
 * The request shape for {@link EntitiesCatalog.facets}.
 */
export interface EntityFacetsRequest {
  /**
   * A filter to apply on the full list of entities before computing the facets.
   */
  filter?: EntityFilter;
  /**
   * The facets to compute.
   *
   * @remarks
   *
   * This is a list of strings corresponding to paths within individual entity
   * shapes. For example, to compute the facets for all available tags, you
   * would pass in the string 'metadata.tags'.
   */
  facets: string[];
  /**
   * The optional token that authorizes the action.
   */
  authorizationToken?: string;
}

/**
 * The response shape for {@link EntitiesCatalog.facets}.
 */
export interface EntityFacetsResponse {
  /**
   * The computed facets, one entry per facet in the request.
   */
  facets: Record<string, Array<{ value: string; count: number }>>;
}

export interface EntitiesCatalog {
  /**
   * Fetch entities.
   *
   * @param request - Request options
   */
  entities(request?: EntitiesRequest): Promise<EntitiesResponse>;

  /**
   * Fetch entities and scroll back and forth between entities.
   *
   * @alpha
   * @param request
   */
  paginatedEntities(
    request?: PaginatedEntitiesRequest,
  ): Promise<PaginatedEntitiesResponse>;

  /**
   * Removes a single entity.
   *
   * @param uid - The metadata.uid of the entity
   */
  removeEntityByUid(
    uid: string,
    options?: { authorizationToken?: string },
  ): Promise<void>;

  /**
   * Returns the full ancestry tree upward along reference edges.
   *
   * @param entityRef - An entity reference to the root of the tree
   */
  entityAncestry(
    entityRef: string,
    options?: { authorizationToken?: string },
  ): Promise<EntityAncestryResponse>;

  /**
   * Computes facets for a set of entities, e.g. for populating filter lists
   * or driving insights or similar.
   *
   * @param request - Request options
   */
  facets(request: EntityFacetsRequest): Promise<EntityFacetsResponse>;
}

/**
 * The request shape for {@link EntitiesCatalog.paginatedEntities}.
 *
 * @alpha
 */
export type PaginatedEntitiesRequest =
  | PaginatedEntitiesInitialRequest
  | PaginatedEntitiesCursorRequest;

/**
 * The initial request for {@link EntitiesCatalog.paginatedEntities}.
 * The request take immutable properties that are going to be bound
 * for the current and the next pagination requests.
 *
 * @alpha
 */
export interface PaginatedEntitiesInitialRequest {
  authorizationToken?: string;
  fields?: (entity: Entity) => Entity;
  limit?: number;
  filter?: EntityFilter;
  sortFields?: EntitySortField[];
  query?: string;
}

/**
 * Request for {@link EntitiesCatalog.paginatedEntities} used to
 * move forward or backward on the data.
 *
 * @alpha
 */
export interface PaginatedEntitiesCursorRequest {
  authorizationToken?: string;
  fields?: (entity: Entity) => Entity;
  limit?: number;
  cursor: string;
}

/**
 * The response shape for {@link EntitiesCatalog.paginatedEntities}.
 *
 * @alpha
 */
export interface PaginatedEntitiesResponse {
  /**
   * The entities for the current pagination request
   */
  entities: Entity[];
  /**
   * The cursor of the next pagination request.
   */
  nextCursor?: string;
  /**
   * The cursor of the previous pagination request.
   */
  prevCursor?: string;
  /**
   * the total number of entities matching the current filters.
   */
  totalItems: number;
}

/**
 * The Cursor used internally by the catalog.
 *
 * @alpha
 */
export type Cursor = {
  /**
   * An array of fields used for sorting the data.
   * For example, [ { field: 'metadata.name', order: 'asc' } ]
   */
  sortFields: EntitySortField[];
  /**
   * The value of the cursor of the last item returned.
   * This is used for performing pagination.
   */
  sortFieldIds: string[];

  /**
   * A filter to apply on the full list of entities.
   */
  filter?: EntityFilter;
  /**
   * true if the cursor is a previous cursor.
   */
  isPrevious: boolean;
  /**
   * Filter the data by name.
   */
  query?: string;
  /**
   * Sort field id of the first item.
   * The catalog uses this field internally for understanding when the beginning
   * of the list has been reached when performing cursor based pagination.
   */
  firstFieldId: string;
  /**
   * The number of items that match the provided filters
   */
  totalItems?: number;
};
