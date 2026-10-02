/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';
import { useLingui } from '@lingui/react/macro';
import type { PointerEvent, RefObject } from 'react';
import { useMemo, useRef, useState } from 'react';
import type { VirtuosoGridHandle } from 'react-virtuoso';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import { darkPanelColor, ELEVATION } from '@/features/theme/services/ForkComponentOverrides.ts';

const MIN_MANGAS_FOR_INDEX = 20;
const OTHER = '#';

/** "Ärger" -> "A", "007" -> "#", "ネ" -> "#" */
const getLetter = (title: string): string => {
    const first = title.trim().normalize('NFD').replaceAll(/\p{M}/gu, '').charAt(0).toUpperCase();

    return /[A-Z]/.test(first) ? first : OTHER;
};

/**
 * Letters in the order they first appear in the (title sorted) list, each with the index of its first manga.
 * The order follows the list, so a descending sort shows Z first.
 */
const getLetterStarts = (titles: string[], followListOrder: boolean): [string, number][] => {
    const starts = new Map<string, number>();
    titles.forEach((title, index) => {
        const letter = getLetter(title);
        if (!starts.has(letter)) {
            starts.set(letter, index);
        }
    });

    const entries = [...starts.entries()];
    // in any other sort order the list order says nothing about the alphabet: show # then A-Z
    const rank = (letter: string) => (letter === OTHER ? '' : letter);

    return followListOrder ? entries : entries.sort(([a], [b]) => rank(a).localeCompare(rank(b)));
};

/**
 * A strip of letters at the right edge of the library: tap or drag over a letter to jump to the first series that
 * starts with it.
 */
export const LibraryLetterIndex = ({
    titles,
    gridHandleRef,
    followListOrder = true,
    topOffset = 0,
}: {
    titles: string[];
    gridHandleRef: RefObject<VirtuosoGridHandle | null>;
    /** the list is in title order; otherwise a jump goes to the first series with that letter, wherever it is */
    followListOrder?: boolean;
    /** space taken by sticky elements above the list (tabs); the app bar is added on top */
    topOffset?: number;
}) => {
    const theme = useTheme();
    const { t } = useLingui();
    const { appBarHeight } = useNavBarContext();

    const stripRef = useRef<HTMLDivElement>(null);
    const [activeLetter, setActiveLetter] = useState<string | null>(null);
    const lastJumpRef = useRef<string | null>(null);

    const letters = useMemo(() => getLetterStarts(titles, followListOrder), [titles, followListOrder]);

    if (titles.length < MIN_MANGAS_FOR_INDEX || letters.length < 2) {
        return null;
    }

    const jumpTo = (letter: string) => {
        if (lastJumpRef.current === letter) {
            return;
        }
        lastJumpRef.current = letter;
        setActiveLetter(letter);

        const index = letters.find(([l]) => l === letter)?.[1];
        if (index !== undefined) {
            gridHandleRef.current?.scrollToIndex({
                index,
                align: 'start',
                behavior: 'auto',
                offset: -(appBarHeight + topOffset + 8),
            });
        }
    };

    const letterAtPointer = (event: PointerEvent): string | undefined => {
        const rect = stripRef.current?.getBoundingClientRect();
        if (!rect || rect.height === 0) {
            return undefined;
        }
        const ratio = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 0.9999);

        return letters[Math.floor(ratio * letters.length)]?.[0];
    };

    const handlePointer = (event: PointerEvent) => {
        const letter = letterAtPointer(event);
        if (letter) {
            jumpTo(letter);
        }
    };

    const finishPointer = () => {
        lastJumpRef.current = null;
        setActiveLetter(null);
    };

    return (
        <>
            {/* big letter bubble while pressing, so the finger does not hide what was picked */}
            {activeLetter && (
                <Box
                    aria-hidden
                    sx={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: theme.zIndex.modal,
                        width: 84,
                        height: 84,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '20px',
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        color: 'primary.main',
                        backgroundColor: darkPanelColor(theme),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                        boxShadow: ELEVATION.lg,
                        pointerEvents: 'none',
                    }}
                >
                    {activeLetter}
                </Box>
            )}
            <Box
                ref={stripRef}
                role="group"
                aria-label={t`Jump to letter`}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    handlePointer(event);
                }}
                onPointerMove={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        handlePointer(event);
                    }
                }}
                onPointerUp={finishPointer}
                onPointerCancel={finishPointer}
                sx={{
                    position: 'fixed',
                    right: { xs: 2, md: 18 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    width: 24,
                    maxHeight: 'calc(100vh - 260px)',
                    overflow: 'hidden',
                    py: 0.5,
                    borderRadius: '12px',
                    // alpha() cannot parse the color-mix() that darkPanelColor returns
                    backgroundColor: `color-mix(in srgb, ${darkPanelColor(theme)} 78%, transparent)`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                    boxShadow: ELEVATION.sm,
                    // dragging along the strip must not scroll the page
                    touchAction: 'none',
                    userSelect: 'none',
                    cursor: 'pointer',
                }}
            >
                {letters.map(([letter]) => (
                    <Box
                        key={letter}
                        aria-label={t`Jump to ${letter}`}
                        sx={{
                            // a real height to start from (a 0 basis collapsed the whole strip); shrinks on short screens
                            flex: '0 1 20px',
                            minHeight: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            // bigger hit area than the glyph; keeps 27 letters tappable on short screens
                            minWidth: 24,
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            lineHeight: 1,
                            color: activeLetter === letter ? 'primary.main' : 'text.secondary',
                            transition: 'color 120ms ease',
                        }}
                    >
                        {letter}
                    </Box>
                ))}
            </Box>
        </>
    );
};
