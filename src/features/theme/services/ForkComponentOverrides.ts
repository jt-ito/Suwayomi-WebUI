/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Components, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const TACTILE_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

const surfaceBorder = (theme: Theme) => `1px solid ${alpha(theme.palette.text.primary, 0.1)}`;

/**
 * Component style overrides (rounded corners, tactile press states, softer surfaces) applied on top of every app theme.
 * App themes can still override any of these through their own "components".
 */
export const FORK_COMPONENT_OVERRIDES: Components<Theme> = {
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 550,
                letterSpacing: '-0.01em',
                transition: `background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 100ms ${TACTILE_EASING}, box-shadow 160ms ease`,
                '&:active': { transform: 'scale(0.97)' },
            },
            outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
            contained: {
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
                '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)' },
            },
        },
    },
    MuiIconButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                transition: `background-color 150ms ease, color 150ms ease, transform 100ms ${TACTILE_EASING}`,
                '&:active': { transform: 'scale(0.92)' },
            },
        },
    },
    MuiFab: {
        styleOverrides: {
            root: {
                borderRadius: 14,
                boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.3)',
                transition: `transform 160ms ${TACTILE_EASING}, box-shadow 160ms ease`,
                '&:active': { transform: 'scale(0.94)' },
            },
        },
    },
    MuiChip: {
        styleOverrides: {
            root: {
                borderRadius: 9999,
                fontWeight: 500,
                transition: `background-color 150ms ease, border-color 150ms ease, transform 100ms ${TACTILE_EASING}`,
                '&:active': { transform: 'scale(0.96)' },
            },
        },
    },
    MuiTabs: { styleOverrides: { root: { minHeight: 44 } } },
    MuiTab: {
        styleOverrides: {
            root: {
                textTransform: 'none',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                minHeight: 44,
                borderRadius: '8px 8px 0 0',
                transition: 'color 150ms ease, background-color 150ms ease',
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                transition: `transform 200ms ${TACTILE_EASING}, box-shadow 200ms ${TACTILE_EASING}, border-color 200ms ease`,
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.3)',
                    zIndex: 15,
                },
            },
        },
    },
    MuiOutlinedInput: {
        styleOverrides: {
            root: { borderRadius: 10, transition: 'border-color 150ms ease, box-shadow 150ms ease' },
        },
    },
    MuiSwitch: {
        styleOverrides: {
            switchBase: { transition: `transform 150ms ${TACTILE_EASING}, color 150ms ease` },
            thumb: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)' },
            track: { borderRadius: 999, transition: 'background-color 150ms ease, opacity 150ms ease' },
        },
    },
    MuiCheckbox: {
        styleOverrides: {
            root: {
                transition: `transform 100ms ${TACTILE_EASING}, color 150ms ease`,
                '&:active': { transform: 'scale(0.9)' },
            },
        },
    },
    MuiRadio: {
        styleOverrides: {
            root: {
                transition: `transform 100ms ${TACTILE_EASING}, color 150ms ease`,
                '&:active': { transform: 'scale(0.9)' },
            },
        },
    },
    MuiSlider: {
        styleOverrides: {
            root: { height: 6 },
            track: { borderRadius: 4 },
            rail: { borderRadius: 4, opacity: 0.3 },
            thumb: ({ theme }) => ({
                width: 18,
                height: 18,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                transition: `box-shadow 150ms ease, transform 100ms ${TACTILE_EASING}`,
                '&:hover, &.Mui-focusVisible': { boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}` },
                '&.Mui-active': { transform: 'scale(1.15)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' },
            }),
        },
    },
    MuiListSubheader: {
        styleOverrides: {
            root: ({ theme }) => ({
                background: 'transparent',
                color: theme.palette.primary.main,
                fontSize: '0.76rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1.4,
            }),
        },
    },
    MuiDialog: {
        styleOverrides: {
            paper: ({ theme }) => ({
                borderRadius: 16,
                backgroundImage: 'none',
                border: surfaceBorder(theme),
                boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.5)',
            }),
        },
    },
    MuiPopover: {
        styleOverrides: {
            paper: ({ theme }) => ({
                borderRadius: 12,
                backgroundImage: 'none',
                border: surfaceBorder(theme),
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.4)',
            }),
        },
    },
    MuiAppBar: {
        styleOverrides: {
            root: ({ theme }) => ({
                backgroundImage: 'none',
                backdropFilter: 'blur(20px) saturate(180%)',
                borderBottom: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                transition: 'background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
                '& .MuiToolbar-root': { minHeight: 52, height: 52, paddingLeft: 12, paddingRight: 14 },
                // search fields in the app bar: rounded outlined box instead of MUI's flat underline
                '& .MuiInputBase-root': {
                    borderRadius: 8,
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.18)}`,
                    backgroundColor: alpha(theme.palette.text.primary, 0.05),
                    padding: '4px 8px 4px 12px',
                    transition: 'border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease',
                    '&:hover:not(.Mui-focused)': { borderColor: alpha(theme.palette.text.primary, 0.3) },
                    '&.Mui-focused': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.text.primary, 0.08),
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                },
                '& .MuiInput-underline:before, & .MuiInput-underline:after': { display: 'none' },
                '& .MuiInputBase-input': { padding: 4, fontSize: '0.875rem', lineHeight: 1.4 },
                '& .MuiInputAdornment-positionEnd .MuiIconButton-root': { padding: 4, marginRight: -2 },
            }),
        },
    },
};
