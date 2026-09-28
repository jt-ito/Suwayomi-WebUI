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
    // ListSubheader's own look/size (transparent, vertically-centered) is a global theme default
    // (ForkComponentOverrides.ts) so it's identical everywhere a section header appears, not just here.
    '& .MuiListItemButton-root, & .MuiListItem-root:not(.MuiListSubheader-root)': {
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
    // clickable rows (nav links, dialog openers) - the whole row is the tap target, so it earns the roomier size
    '& .MuiListItemButton-root': {
        minHeight: 50,
        padding: '8px 18px',
    },
    // plain rows (a label next to an inline Switch/Select/etc.) - only the control itself is interactive,
    // so the row doesn't need to be as tall or padded as a full tappable button
    '& .MuiListItem-root:not(.MuiListItemButton-root):not(.MuiListSubheader-root)': {
        minHeight: 44,
        padding: '6px 18px',
    },
    // rows with a multi-line secondary value (e.g. "Include: All" / "Exclude: None") shouldn't blow up the row height
    '& .MuiListItemText-secondary': { fontSize: '0.8rem', lineHeight: 1.35 },
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
