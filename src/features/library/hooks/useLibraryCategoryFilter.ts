/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { useGetCategoryMetadata } from '@/features/category/services/CategoryMetadata.ts';
import type { CategoryIdInfo, CategoryMetadataInfo } from '@/features/category/Category.types.ts';
import { listTriStateBooleanFilter } from '@/features/library/hooks/useGetVisibleLibraryMangas.ts';
import { GET_MANGA_CATEGORY_IDS, GET_MANGAS_LIBRARY } from '@/lib/graphql/manga/MangaQuery.ts';
import type {
    GetMangaCategoryIdsQuery,
    GetMangaCategoryIdsQueryVariables,
    GetMangasLibraryQuery,
    GetMangasLibraryQueryVariables,
} from '@/lib/graphql/generated/graphql.ts';
import { STABLE_EMPTY_ARRAY } from '@/base/Base.constants.ts';

const DEFAULT_CATEGORY: CategoryIdInfo = { id: -1 };
const LIBRARY_CONDITION = { condition: { inLibrary: true } };

type LibraryManga = GetMangasLibraryQuery['mangas']['nodes'][number];

/**
 * When the "Categories" filter of the category is active, the library shows the mangas of the whole library, that match
 * the selected categories, instead of only the mangas of the category.
 */
export const useLibraryCategoryFilter = (
    category: CategoryMetadataInfo | undefined,
    categoryMangas: LibraryManga[],
): { mangas: LibraryManga[]; isLoading: boolean; error?: Error } => {
    const { hasCategory } = useGetCategoryMetadata(category ?? DEFAULT_CATEGORY);
    const isActive = Object.values(hasCategory.filters).some((status) => status != null);

    const libraryMangas = requestManager.useGetMangas<GetMangasLibraryQuery, GetMangasLibraryQueryVariables>(
        GET_MANGAS_LIBRARY,
        LIBRARY_CONDITION,
        { skip: !isActive },
    );
    const mangaCategories = requestManager.useGetMangas<GetMangaCategoryIdsQuery, GetMangaCategoryIdsQueryVariables>(
        GET_MANGA_CATEGORY_IDS,
        LIBRARY_CONDITION,
        { skip: !isActive },
    );

    const filteredMangas = useMemo(() => {
        if (!isActive) {
            return categoryMangas;
        }

        const categoryIdsByMangaId = new Map(
            (mangaCategories.data?.mangas.nodes ?? STABLE_EMPTY_ARRAY).map((manga) => [
                manga.id,
                new Set(manga.categories.nodes.map(({ id }) => id)),
            ]),
        );

        return (libraryMangas.data?.mangas.nodes ?? STABLE_EMPTY_ARRAY).filter((manga) =>
            listTriStateBooleanFilter(
                hasCategory.mode,
                hasCategory.filters,
                (categoryId) => categoryIdsByMangaId.get(manga.id)?.has(Number(categoryId)) ?? false,
            ),
        );
    }, [isActive, categoryMangas, libraryMangas.data, mangaCategories.data, hasCategory]);

    return {
        mangas: filteredMangas,
        isLoading: isActive && (libraryMangas.loading || mangaCategories.loading),
        error: isActive ? (libraryMangas.error ?? mangaCategories.error) : undefined,
    };
};
