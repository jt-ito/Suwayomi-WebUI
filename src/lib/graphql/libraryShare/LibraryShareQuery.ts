/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';
import { LIBRARY_SHARE_FIELDS } from '@/lib/graphql/libraryShare/LibraryShareFragments.ts';

export const GET_LIBRARY_SHARES = gql`
    ${LIBRARY_SHARE_FIELDS}

    query GET_LIBRARY_SHARES {
        libraryShares {
            ...LIBRARY_SHARE_FIELDS
        }
    }
`;
