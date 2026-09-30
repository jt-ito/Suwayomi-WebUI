/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Paper from '@mui/material/Paper';
import type { CSSProperties } from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import {} from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import { ELEVATION, activeIconGlow, glassSurface } from '@/features/theme/services/ForkComponentOverrides.ts';
import { useResizeObserver } from '@/base/hooks/useResizeObserver.tsx';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import type { NavbarItem } from '@/features/navigation-bar/NavigationBar.types.ts';
import { NavigationBarItem } from '@/features/navigation-bar/components/NavigationBarItem.tsx';
import Stack from '@mui/material/Stack';

// gap between the floating pill and the viewport edges
const BOTTOM_BAR_GAP = 12;

export const MobileBottomBar = ({ navBarItems }: { navBarItems: NavbarItem[] }) => {
    const theme = useTheme();
    const { setBottomBarHeight } = useNavBarContext();

    const ref = useRef<HTMLDivElement | null>(null);
    useResizeObserver(
        ref,
        useCallback(() => {
            // distance from the viewport bottom to the pill's top: pill height + floating gap + safe area
            setBottomBarHeight(
                ref.current ? Math.ceil(window.innerHeight - ref.current.getBoundingClientRect().top) : 0,
            );
        }, [ref.current]),
    );
    useLayoutEffect(() => () => setBottomBarHeight(0), []);

    return (
        <Paper
            ref={ref}
            sx={{
                position: 'fixed',
                bottom: `calc(${BOTTOM_BAR_GAP}px + env(safe-area-inset-bottom))`,
                left: `calc(${BOTTOM_BAR_GAP}px + env(safe-area-inset-left))`,
                right: `calc(${BOTTOM_BAR_GAP}px + env(safe-area-inset-right))`,
                borderRadius: 9999,
                overflow: 'hidden',
                zIndex: theme.zIndex.drawer - 1,
                ...glassSurface(theme.palette.background.paper, 0.8, 16),
                border: `1px solid ${alpha(theme.palette.text.primary, 0.14)}`,
                boxShadow: ELEVATION.lg,
                ...activeIconGlow(theme),
            }}
            style={{
                ...(theme.applyStyles('dark', {
                    '--Paper-overlay': 'unset',
                }) as CSSProperties),
            }}
            elevation={3}
        >
            <Stack sx={{ flexDirection: 'row', px: 1 }}>
                {navBarItems.map((item) => (
                    <NavigationBarItem
                        key={item.path}
                        {...item}
                        slots={{
                            listItemLink: {
                                sx: {
                                    py: 1,
                                },
                            },
                        }}
                        forceCollapsed
                    />
                ))}
            </Stack>
        </Paper>
    );
};
