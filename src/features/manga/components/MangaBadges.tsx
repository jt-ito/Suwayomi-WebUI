/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { styled } from '@mui/material/styles';
import { useState } from 'react';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { useLingui } from '@lingui/react/macro';
import { plural } from '@lingui/core/macro';
import type { MangaCardMode } from '@/features/manga/Manga.types.ts';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';
import { useMetadataServerSettings } from '@/features/settings/services/ServerSettingsMetadata.ts';
import { MUIUtil } from '@/lib/mui/MUI.util.ts';
import { MangaStatus } from '@/lib/graphql/generated/graphql-base.types.ts';
import { MANGA_STATUS_TO_COLOR, MANGA_STATUS_TO_TRANSLATION } from '@/features/manga/Manga.constants.ts';

const BadgeContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    height: 'fit-content',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
}));

const Badge = styled(Typography)(({ theme }) => ({
    color: theme.palette.primary.contrastText,
    paddingInline: theme.spacing(0.3),
}));

export const MangaBadges = ({
    inLibraryIndicator,
    updateLibraryState,
    isInLibrary,
    unread,
    downloadCount,
    chapterCount,
    onPeekChapterCount,
    status,
    isSourceMissing,
    mode,
}: {
    inLibraryIndicator?: boolean;
    updateLibraryState: () => void;
    isInLibrary: boolean;
    unread?: number;
    downloadCount?: number;
    // known chapter count for "source" mode cards (e.g. global/browse search results), where it isn't fetched by default
    chapterCount?: number;
    // fetches the live chapter count from the source on demand, when it isn't already known; resolves with the count
    onPeekChapterCount?: () => Promise<number>;
    // release status (ongoing/completed/hiatus/...), only known for library cards ("default" mode)
    status?: MangaStatus;
    isSourceMissing?: boolean;
    mode: MangaCardMode;
}) => {
    const { t } = useLingui();

    const isTouchDevice = MediaQuery.useIsTouchDevice();

    const {
        settings: { showUnreadBadge, showDownloadBadge },
    } = useMetadataServerSettings();

    const [isPeeking, setIsPeeking] = useState(false);
    const [peekedChapterCount, setPeekedChapterCount] = useState<number | null>(null);

    // ponytail: "0 known chapters" is treated as "never fetched" unless it was just peeked - a manga that
    // genuinely has 0 chapters keeps showing the peek button, which is harmless (peeking it just confirms 0)
    const isChapterCountKnown = !!chapterCount || peekedChapterCount !== null;
    const displayedChapterCount = peekedChapterCount ?? chapterCount ?? 0;

    const handlePeekChapterCount = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isPeeking || !onPeekChapterCount) {
            return;
        }

        setIsPeeking(true);
        try {
            setPeekedChapterCount(await onPeekChapterCount());
        } finally {
            setIsPeeking(false);
        }
    };

    return (
        <BadgeContainer>
            {mode === 'source' && isChapterCountKnown && (
                <CustomTooltip title={plural(displayedChapterCount, { one: '# chapter', other: '# chapters' })}>
                    <Badge
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.3,
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                        }}
                    >
                        <AutoStoriesIcon sx={{ fontSize: '1em' }} />
                        {displayedChapterCount}
                    </Badge>
                </CustomTooltip>
            )}
            {mode === 'source' && !isChapterCountKnown && !!onPeekChapterCount && (
                <CustomTooltip title={t`Chapter count unknown, click to fetch it from the source`}>
                    <ButtonBase
                        aria-label={t`Fetch chapter count`}
                        onClick={handlePeekChapterCount}
                        sx={{ cursor: isPeeking ? 'default' : 'pointer' }}
                    >
                        <Badge
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: 'action.selected',
                                color: 'text.primary',
                            }}
                        >
                            {isPeeking ? (
                                <CircularProgress size="1em" color="inherit" />
                            ) : (
                                <VisibilityIcon sx={{ fontSize: '1em' }} />
                            )}
                        </Badge>
                    </ButtonBase>
                </CustomTooltip>
            )}
            {isSourceMissing && (
                <CustomTooltip title={t`Source missing. Check your installed extensions.`}>
                    <Badge
                        aria-label={t`Source missing`}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'warning.main',
                            color: 'warning.contrastText',
                        }}
                    >
                        <WarningAmberIcon sx={{ fontSize: '1em' }} />
                    </Badge>
                </CustomTooltip>
            )}
            {!isTouchDevice && inLibraryIndicator && mode === 'source' && (
                <Button
                    className="source-manga-library-state-button"
                    component="div"
                    variant="contained"
                    size="small"
                    {...MUIUtil.preventRippleProp()}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateLibraryState();
                    }}
                    sx={{
                        display: 'none',
                    }}
                    color={isInLibrary ? 'error' : 'primary'}
                >
                    {isInLibrary ? t`Remove from the library` : t`Add To Library`}
                </Button>
            )}
            {inLibraryIndicator && isInLibrary && (
                <Typography
                    className="source-manga-library-state-indicator"
                    sx={{ backgroundColor: 'primary.dark', color: 'primary.contrastText', p: 0.3 }}
                >
                    {t`In Library`}
                </Typography>
            )}
            {((showUnreadBadge && mode === 'default') || mode === 'duplicate') && (unread ?? 0) > 0 && (
                <Badge sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>{unread}</Badge>
            )}
            {((showDownloadBadge && mode === 'default') || mode === 'duplicate') && (downloadCount ?? 0) > 0 && (
                <Badge
                    sx={{
                        backgroundColor: 'secondary.main',
                        color: 'secondary.contrastText',
                    }}
                >
                    {downloadCount}
                </Badge>
            )}
            {mode === 'default' && !!status && status !== MangaStatus.Unknown && (
                <Badge
                    sx={{
                        backgroundColor:
                            MANGA_STATUS_TO_COLOR[status] === 'default'
                                ? 'action.selected'
                                : `${MANGA_STATUS_TO_COLOR[status]}.main`,
                        color:
                            MANGA_STATUS_TO_COLOR[status] === 'default'
                                ? 'text.primary'
                                : `${MANGA_STATUS_TO_COLOR[status]}.contrastText`,
                    }}
                >
                    {t(MANGA_STATUS_TO_TRANSLATION[status])}
                </Badge>
            )}
        </BadgeContainer>
    );
};
