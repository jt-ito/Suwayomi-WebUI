/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { memo } from 'react';

export const StyledGroupItemWrapper = memo(
    styled(Box)(({ theme }) => ({
        // top room for the card's 3px hover lift, so it isn't cut off by the sticky group header above it
        padding: theme.spacing(0.5, 1, 0.5, 1),
    })),
);
