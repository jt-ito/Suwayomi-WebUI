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
import { ELEVATION, activeIconGlow } from '@/features/theme/services/ForkComponentOverrides.ts';
import { useResizeObserver } from '@/base/hooks/useResizeObserver.tsx';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import type { NavbarItem } from '@/features/navigation-bar/NavigationBar.types.ts';
import { NavigationBarItem } from '@/features/navigation-bar/components/NavigationBarItem.tsx';
import Stack from '@mui/material/Stack';

// gap between the floating pill and the bottom / side edges of the viewport
const BOTTOM_BAR_GAP = 4;
const SIDE_BAR_GAP = 12;

export const MobileBottomBar = ({ navBarItems }: { navBarItems: NavbarItem[] }) => {
    const theme = useTheme();
    const { setBottomBarHeight } = useNavBarContext();

    const ref = useRef<HTMLDivElement | null>(null);
    useResizeObserver(
        ref,
        useCallback(() => {
            // pill height + floating gap. The safe area is not part of it: it changes when the browser's toolbar
            // slides away, without the pill changing size, so everything that sits above the pill adds
            // env(safe-area-inset-bottom) itself
            setBottomBarHeight(
                ref.current ? Math.ceil(ref.current.getBoundingClientRect().height) + BOTTOM_BAR_GAP : 0,
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
                left: `calc(${SIDE_BAR_GAP}px + env(safe-area-inset-left))`,
                right: `calc(${SIDE_BAR_GAP}px + env(safe-area-inset-right))`,
                borderRadius: 9999,
                overflow: 'hidden',
                zIndex: theme.zIndex.drawer - 1,
                // Liquid glass: a nearly clear, strongly blurred body with bright specular edges, then a tint on top.
                // (A tint alone reads as a solid color over flat pages, the glass has to carry the look.)
                backgroundColor: alpha('#fff', 0.06),
                backdropFilter: 'blur(18px) saturate(190%)',
                WebkitBackdropFilter: 'blur(18px) saturate(190%)',
                backgroundImage: [
                    // light catching the top left of the glass
                    `radial-gradient(120% 160% at 12% 0%, ${alpha('#fff', 0.24)}, transparent 55%)`,
                    // the tint
                    `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.primary.main, 0.06)})`,
                ].join(', '),
                border: `1px solid ${alpha('#fff', 0.2)}`,
                boxShadow: [
                    ELEVATION.lg,
                    `inset 0 1px 1px ${alpha('#fff', 0.55)}`,
                    `inset 0 -1px 1px ${alpha('#fff', 0.18)}`,
                    `inset 0 0 18px ${alpha('#fff', 0.07)}`,
                ].join(', '),
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
