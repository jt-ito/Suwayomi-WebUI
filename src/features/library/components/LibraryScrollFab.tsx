/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { StyledFab } from '@/base/components/buttons/StyledFab.tsx';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';

type ScrollTarget = 'top' | 'bottom' | null;

const getTarget = (): ScrollTarget => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max < window.innerHeight / 2) {
        return null; // page barely scrolls
    }
    return window.scrollY > max / 2 ? 'top' : 'bottom';
};

const scrollTo = (target: 'top' | 'bottom') => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
        top: target === 'top' ? 0 : document.documentElement.scrollHeight,
        behavior: isReducedMotion ? 'auto' : 'smooth',
    });
};

/** One FAB that jumps to the top when in the lower half of the page, otherwise to the bottom. */
export const LibraryScrollFab = ({ contentKey }: { contentKey: unknown }) => {
    const { t } = useLingui();
    // on desktop the sidebar (0 wide on mobile) sits above the FAB, so it must start to the right of it
    const { navBarWidth } = useNavBarContext();
    const [target, setTarget] = useState<ScrollTarget>(null);

    useEffect(() => {
        const update = () => setTarget(getTarget());
        update();
        // re-check after the grid has laid out for the new category/filter
        const timeout = setTimeout(update, 500);
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            clearTimeout(timeout);
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [contentKey]);

    if (!target) {
        return null;
    }

    return (
        <StyledFab
            size="medium"
            color="primary"
            aria-label={target === 'top' ? t`Scroll to top` : t`Scroll to bottom`}
            onClick={() => scrollTo(target)}
            sx={(theme) => ({
                right: 'auto',
                left: `${navBarWidth + 16}px`,
                zIndex: 1,
                transition: 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
                '&:active': { transform: 'scale(0.96)' },
                [theme.breakpoints.down('md')]: { marginBottom: '64px' },
            })}
        >
            {target === 'top' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </StyledFab>
    );
};
