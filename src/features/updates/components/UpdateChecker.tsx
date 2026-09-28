/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ClearIcon from '@mui/icons-material/Clear';
import Stack from '@mui/material/Stack';
import { useLingui } from '@lingui/react/macro';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { CircularProgressWithText } from '@/base/components/feedback/CircularProgressWithText.tsx';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { dateTimeFormatter } from '@/base/utils/DateHelper.ts';
import { MediaQuery } from '@/base/utils/MediaQuery.tsx';
import type { CategoryIdInfo } from '@/features/category/Category.types.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { SearchParam } from '@/base/Base.types.ts';
import { UrlUtil } from '@/lib/UrlUtil.ts';
import { GET_CHAPTERS_UPDATES } from '@/lib/graphql/chapter/ChapterQuery.ts';
import type { GetChaptersUpdatesQuery, GetChaptersUpdatesQueryVariables } from '@/lib/graphql/generated/graphql.ts';

import { getErrorMessage } from '@/lib/HelperFunctions.ts';

let lastRunningState = false;

// tracks the update this tab itself started, so its completion can be reported with a "new chapters" toast;
// updates started elsewhere (another tab, a scheduled run) are still detected by the effect below but not announced
type UpdateScope = { startedAt: number; categoryId?: CategoryIdInfo['id'] };
let lastUpdateScope: UpdateScope | null = null;

export function UpdateChecker({
    categoryId,
    categoryName,
    handleFinishedUpdate,
}: {
    categoryId?: CategoryIdInfo['id'];
    categoryName?: string;
    handleFinishedUpdate?: () => void;
}) {
    const { t } = useLingui();
    const navigate = useNavigate();
    const isTouchDevice = MediaQuery.useIsTouchDevice();

    const [isHovered, setIsHovered] = useState(false);

    const { data: lastUpdateTimestampData, refetch: reFetchLastTimestamp } =
        requestManager.useGetLastGlobalUpdateTimestamp();

    const { data: updaterData } = requestManager.useGetGlobalUpdateSummary();
    const status = updaterData?.libraryUpdateStatus;

    const lastUpdateTimestamp = lastUpdateTimestampData?.lastUpdateTimestamp.timestamp;
    const date = lastUpdateTimestamp ? dateTimeFormatter.format(+lastUpdateTimestamp) : '-';

    const isRunning = !!status?.jobsInfo.isRunning;
    const progress = status ? (status.jobsInfo.finishedJobs / status.jobsInfo.totalJobs) * 100 : 0;

    // summarizes the chapters fetched since the update started into a single toast, e.g. "12 new chapters across 5 manga"
    const notifyNewChapters = async (scope: UpdateScope) => {
        const { data } = await requestManager.graphQLClient.client.query<
            GetChaptersUpdatesQuery,
            GetChaptersUpdatesQueryVariables
        >({
            query: GET_CHAPTERS_UPDATES,
            variables: {
                filter: { inLibrary: { equalTo: true }, fetchedAt: { greaterThan: `${scope.startedAt}` } },
                // ponytail: manga count below is approximate past this many new chapters, uncap if that matters
                first: 500,
            },
            fetchPolicy: 'network-only',
        });

        const newChapterCount = data?.chapters.totalCount ?? 0;
        if (!newChapterCount) {
            return;
        }

        const newChapters = data?.chapters.nodes ?? [];
        const mangaCount = new Set(newChapters.map((chapter) => chapter.mangaId)).size;
        // nodes are ordered newest first, so the first one is the manga to jump to on click
        const targetMangaId = newChapters[0]?.mangaId;

        makeToast(
            scope.categoryId !== undefined && categoryName
                ? t`New chapters in ${categoryName}: ${newChapterCount} across ${mangaCount} manga`
                : t`New chapters available: ${newChapterCount} across ${mangaCount} manga`,
            'success',
            undefined,
            targetMangaId !== undefined
                ? () => navigate(UrlUtil.addParams(AppRoutes.updates.path, { [SearchParam.MANGA]: `${targetMangaId}` }))
                : undefined,
        );
    };

    useEffect(() => {
        if (!lastRunningState && isRunning) {
            lastRunningState = true;
        }

        const isUpdateFinished = lastRunningState && progress === 100;
        if (!isUpdateFinished) {
            return;
        }

        lastRunningState = false;
        const finishedScope = lastUpdateScope;
        lastUpdateScope = null;
        handleFinishedUpdate?.();
        if (finishedScope) {
            notifyNewChapters(finishedScope).catch(defaultPromiseErrorHandler('UpdateChecker::notifyNewChapters'));
        }
        // this re-fetch is necessary since a running update could have been triggered by the server or another client
        reFetchLastTimestamp().catch(defaultPromiseErrorHandler('UpdateChecker::reFetchLastTimestamp'));
    }, [isRunning]);

    const startUpdate = async (category?: CategoryIdInfo['id']) => {
        try {
            lastRunningState = true;
            lastUpdateScope = { startedAt: Date.now(), categoryId: category };
            await requestManager.startGlobalUpdate(category !== undefined ? [category] : undefined).response;
            reFetchLastTimestamp().catch(defaultPromiseErrorHandler('UpdateChecker::reFetchLastTimestamp'));
        } catch (e) {
            lastRunningState = false;
            lastUpdateScope = null;
            makeToast(t`Could not check for updates`, 'error', getErrorMessage(e));
        }
    };

    const stopUpdate = async () => {
        try {
            await requestManager.resetGlobalUpdate();
        } catch (e) {
            makeToast(t`Could not stop global update`, 'error', getErrorMessage(e));
        }
    };

    const onClick = async (category?: CategoryIdInfo['id']) => {
        if (isRunning) {
            stopUpdate();
        } else {
            startUpdate(category);
        }
    };

    return (
        <PopupState variant="popover" popupId="library-update-checker-menu">
            {(popupState) => (
                <>
                    <CustomTooltip title={isRunning ? t`Stop global update` : t`Global update (last update: ${date})`}>
                        <IconButton
                            sx={{ position: 'relative' }}
                            {...(categoryId !== undefined && !isRunning
                                ? bindTrigger(popupState)
                                : { onClick: () => onClick() })}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            color="inherit"
                        >
                            {!isRunning ? (
                                <RefreshIcon />
                            ) : (
                                <>
                                    <ClearIcon sx={{ opacity: Number(isTouchDevice || isHovered) }} />
                                    <Stack sx={{ position: 'absolute' }}>
                                        <CircularProgressWithText
                                            progress={progress}
                                            showText={!isTouchDevice && !isHovered}
                                            progressProps={{ color: 'inherit' }}
                                        />
                                    </Stack>
                                </>
                            )}
                        </IconButton>
                    </CustomTooltip>
                    <Menu {...bindMenu(popupState)}>
                        <MenuItem
                            onClick={() => {
                                popupState.close();
                                onClick();
                            }}
                        >
                            {t`Update library`}
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                popupState.close();
                                onClick(categoryId);
                            }}
                        >
                            {t`Update category`}
                        </MenuItem>
                    </Menu>
                </>
            )}
        </PopupState>
    );
}
