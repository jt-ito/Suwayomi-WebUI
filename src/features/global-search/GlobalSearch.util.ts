/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const MIN_QUERY_LENGTH = 3;
const SHORT_QUERY_WORD_COUNT = 3;

/**
 * Sources match a query on their own terms: many only find a manga if the query is (part of) the title they list, which
 * is often shorter than the full title (e.g. without the subtitle).
 *
 * @returns the query itself, followed by simplified versions to try one after another, if nothing was found
 * @example
 * "Villager A Wants to Save the Villainess: The Trench, the Sky"
 * => ["Villager A Wants to Save the Villainess: The Trench, the Sky", "Villager A Wants to Save the Villainess", "Villager A Wants"]
 */
export const getSearchQueryCandidates = (query: string | null | undefined): string[] => {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) {
        return [];
    }

    // "Title: Subtitle", "Title - Subtitle", "Title (Something)"
    const [withoutSubtitle] = trimmedQuery.split(/\s*(?::|\s[-–—]\s|\()/);
    const firstWords = withoutSubtitle.split(/\s+/).slice(0, SHORT_QUERY_WORD_COUNT).join(' ');

    return [...new Set([trimmedQuery, withoutSubtitle.trim(), firstWords])].filter(
        (candidate, index) => index === 0 || candidate.length >= MIN_QUERY_LENGTH,
    );
};
