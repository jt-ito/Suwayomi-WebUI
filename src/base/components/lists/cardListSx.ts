/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { SxProps, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const mixAccent = (theme: Theme, amount: number) =>
    `color-mix(in srgb, ${theme.palette.background.paper} ${100 - amount}%, ${theme.palette.primary.main} ${amount}%)`;

/**
 * Renders the rows of a List as rounded, accent-tinted cards (Settings, About, More).
 */
export const CARD_LIST_SX: SxProps<Theme> = (theme) => ({
    pt: 0.75,
    pb: 5,
    '& .MuiListSubheader-root': {
        background: 'transparent',
        color: theme.palette.primary.main,
        fontSize: '0.76rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: 1.4,
        padding: '14px 18px 5px 18px',
    },
    '& .MuiListItemButton-root, & .MuiListItem-root:not(.MuiListSubheader-root)': {
        minHeight: 50,
        padding: '10px 18px',
        margin: '4px 14px',
        width: 'calc(100% - 28px)',
        boxSizing: 'border-box',
        borderRadius: '10px',
        backgroundColor: mixAccent(theme, 10),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        transition:
            'background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 100ms cubic-bezier(0.2, 0, 0, 1)',
    },
    '& .MuiListItemButton-root:hover': {
        backgroundColor: mixAccent(theme, 20),
        borderColor: alpha(theme.palette.primary.main, 0.4),
        boxShadow: `0 3px 12px -2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    '& .MuiListItemButton-root:active': { transform: 'scale(0.985)' },
    '& .MuiListItem-root:not(.MuiListItemButton-root):hover': {
        backgroundColor: mixAccent(theme, 15),
        borderColor: alpha(theme.palette.primary.main, 0.3),
    },
    '& .MuiListItemIcon-root': { minWidth: 42, color: theme.palette.primary.main },
    '& .MuiListItemIcon-root svg': { width: 21, height: 21 },
    '& .MuiListItemText-primary': { fontSize: '0.92rem', fontWeight: 550 },
});
