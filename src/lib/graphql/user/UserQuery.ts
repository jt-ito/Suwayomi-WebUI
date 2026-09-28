/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import gql from 'graphql-tag';

export const USER_ACCOUNT_FIELDS = gql`
    fragment USER_ACCOUNT_FIELDS on UserAccountType {
        id
        username
        role
        createdAt
        lastLoginAt
    }
`;

export const GET_ME = gql`
    ${USER_ACCOUNT_FIELDS}

    query GET_ME {
        me {
            ...USER_ACCOUNT_FIELDS
        }
    }
`;

export const GET_USERS = gql`
    ${USER_ACCOUNT_FIELDS}

    query GET_USERS {
        users {
            ...USER_ACCOUNT_FIELDS
        }
    }
`;
