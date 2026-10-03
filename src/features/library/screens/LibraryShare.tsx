/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useState } from 'react';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLingui } from '@lingui/react/macro';
import { CARD_LIST_SX } from '@/base/components/lists/cardListSx.ts';
import { ListSubheader } from '@/base/components/lists/ListSubheader.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { makeToast } from '@/base/utils/Toast.ts';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { GET_CATEGORIES_SETTINGS } from '@/lib/graphql/category/CategoryQuery.ts';
import { DEFAULT_CATEGORY_ID } from '@/features/category/services/Categories.ts';
import type {
    GetCategoriesSettingsQuery,
    GetCategoriesSettingsQueryVariables,
    LibraryShareFieldsFragment,
} from '@/lib/graphql/generated/graphql.ts';
import { LibraryShareScope, LibraryShareStatus } from '@/lib/graphql/generated/graphql-base.types.ts';

type Share = LibraryShareFieldsFragment;

export function LibraryShare() {
    const { t } = useLingui();

    useAppTitle(t`Share library`);

    const shares = requestManager.useGetLibraryShares();
    const categories = requestManager.useGetCategories<GetCategoriesSettingsQuery, GetCategoriesSettingsQueryVariables>(
        GET_CATEGORIES_SETTINGS,
    );
    const [createShare, { loading: isSending }] = requestManager.useCreateLibraryShare();

    const [username, setUsername] = useState('');
    const [scope, setScope] = useState<LibraryShareScope>(LibraryShareScope.Library);
    const [categoryIds, setCategoryIds] = useState<number[]>([]);
    const [synced, setSynced] = useState(false);
    // the recipient decides per incoming share whether it follows the sender automatically
    const [autoSyncChoice, setAutoSyncChoice] = useState<Record<number, boolean>>({});

    const shareableCategories = (categories.data?.categories.nodes ?? []).filter(
        ({ id }) => id !== DEFAULT_CATEGORY_ID,
    );
    const canSend = !!username.trim() && (scope === LibraryShareScope.Library || categoryIds.length > 0) && !isSending;

    const send = () =>
        createShare({
            variables: {
                input: {
                    username: username.trim(),
                    scope,
                    categoryIds: scope === LibraryShareScope.Categories ? categoryIds : [],
                    synced,
                },
            },
        })
            .then(() => {
                makeToast(t`Request sent, ${username.trim()} has to accept it`, 'success');
                setUsername('');
                setCategoryIds([]);
            })
            .catch((e) => makeToast(t`Could not send the request`, 'error', getErrorMessage(e)));

    const respond = (share: Share, accept: boolean) =>
        requestManager
            .respondToLibraryShare(share.id, accept, !!autoSyncChoice[share.id])
            .response.then((result) => {
                const added = result.data?.respondToLibraryShare.addedMangas ?? 0;
                makeToast(accept ? t`Added ${added} manga to your library` : t`Request declined`, 'success');
            })
            .catch((e) => makeToast(t`Could not answer the request`, 'error', getErrorMessage(e)));

    const cancel = (share: Share) =>
        requestManager
            .cancelLibraryShare(share.id)
            .response.catch((e) => makeToast(t`Could not cancel the request`, 'error', getErrorMessage(e)));

    const syncNow = (share: Share) =>
        requestManager
            .syncLibraryShare(share.id)
            .response.then((result) => {
                const added = result.data?.syncLibraryShare.addedMangas ?? 0;
                makeToast(t`Added ${added} new manga to your library`, 'success');
            })
            .catch((e) => makeToast(t`Could not sync`, 'error', getErrorMessage(e)));

    const askTwoWay = (share: Share) =>
        requestManager
            .requestTwoWayLibraryShare(share.id)
            .response.then(() => makeToast(t`Request sent, ${share.senderUsername} has to accept it`, 'success'))
            .catch((e) => makeToast(t`Could not send the request`, 'error', getErrorMessage(e)));

    const setAutoSync = (share: Share, autoSync: boolean) =>
        requestManager
            .setLibraryShareAutoSync(share.id, autoSync)
            .response.catch((e) => makeToast(t`Could not save the change`, 'error', getErrorMessage(e)));

    const describe = (share: Share) => {
        const what =
            share.scope === LibraryShareScope.Library
                ? t`the whole library`
                : t`the categories ${share.categoryNames.join(', ')}`;
        return t`${what} (${share.mangaCount} manga)`;
    };

    if (shares.loading || categories.loading) {
        return <LoadingPlaceholder />;
    }

    if (shares.error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t`Unable to load data`}
                messageExtra={getErrorMessage(shares.error)}
                retry={() => shares.refetch()}
            />
        );
    }

    const all = shares.data?.libraryShares ?? [];
    const incoming = all.filter((share) => share.incoming && share.status === LibraryShareStatus.Pending);
    const history = all.filter((share) => !incoming.includes(share));

    const twoWayText = (share: Share) => {
        if (share.pairedWith != null) {
            return t`Two-way sync`;
        }
        if (!share.incoming || share.status !== LibraryShareStatus.Accepted || !share.synced) {
            return '';
        }
        switch (share.twoWayStatus) {
            case LibraryShareStatus.Pending:
                return t`Two-way request waiting for approval`;
            case LibraryShareStatus.Accepted:
                return t`Two-way sync active`;
            case LibraryShareStatus.Declined:
                return t`Two-way request declined`;
            default:
                return '';
        }
    };

    const statusText = (share: Share) => {
        switch (share.status) {
            case LibraryShareStatus.Pending:
                return t`Waiting for approval`;
            case LibraryShareStatus.Accepted:
                return share.synced ? t`Accepted, kept in sync` : t`Accepted`;
            case LibraryShareStatus.Declined:
                return t`Declined`;
            default:
                return t`Cancelled`;
        }
    };

    return (
        <List sx={CARD_LIST_SX}>
            {incoming.length > 0 && (
                <List subheader={<ListSubheader component="div">{t`Waiting for your approval`}</ListSubheader>}>
                    {incoming.map((share) => (
                        <ListItem key={share.id} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            <ListItemText
                                primary={
                                    share.pairedWith != null
                                        ? t`${share.senderUsername} wants to sync back: what they add to ${describe(share)} will be shared with you too`
                                        : t`${share.senderUsername} wants to share ${describe(share)} with you`
                                }
                                secondary={
                                    share.synced
                                        ? t`Nothing is added until you accept. The sender keeps it in sync: manga and categories they add later are shared too. Your reading progress is never shared.`
                                        : t`Nothing is added to your library until you accept`
                                }
                            />
                            {share.synced && (
                                <FormControlLabel
                                    label={t`Sync automatically`}
                                    control={
                                        <Switch
                                            checked={!!autoSyncChoice[share.id]}
                                            onChange={(e) =>
                                                setAutoSyncChoice((choice) => ({
                                                    ...choice,
                                                    [share.id]: e.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                />
                            )}
                            <Stack direction="row" sx={{ gap: 1 }}>
                                <Button variant="contained" onClick={() => respond(share, true)}>
                                    {t`Accept`}
                                </Button>
                                <Button onClick={() => respond(share, false)}>{t`Decline`}</Button>
                            </Stack>
                        </ListItem>
                    ))}
                </List>
            )}

            <List subheader={<ListSubheader component="div">{t`Share with another account`}</ListSubheader>}>
                <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
                    <TextField
                        label={t`Username`}
                        helperText={t`Ask the other person for their exact username, accounts can't be browsed`}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="off"
                    />
                    <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as LibraryShareScope)}>
                        <FormControlLabel
                            value={LibraryShareScope.Library}
                            control={<Radio />}
                            label={t`Entire library`}
                        />
                        <FormControlLabel
                            value={LibraryShareScope.Categories}
                            control={<Radio />}
                            label={t`Only some categories`}
                        />
                    </RadioGroup>
                    <Divider />
                    <RadioGroup value={synced ? 'sync' : 'once'} onChange={(e) => setSynced(e.target.value === 'sync')}>
                        <FormControlLabel value="once" control={<Radio />} label={t`Send as is`} />
                        <FormControlLabel
                            value="sync"
                            control={<Radio />}
                            label={t`Keep in sync: manga and categories you add later are shared too`}
                        />
                    </RadioGroup>
                    {synced && (
                        <Typography variant="body2" color="text.secondary">
                            {t`The other person can choose to follow it automatically. Reading progress is never shared.`}
                        </Typography>
                    )}
                    {scope === LibraryShareScope.Categories &&
                        shareableCategories.map((category) => (
                            <FormControlLabel
                                key={category.id}
                                label={category.name}
                                control={
                                    <Checkbox
                                        checked={categoryIds.includes(category.id)}
                                        onChange={(e) =>
                                            setCategoryIds((ids) =>
                                                e.target.checked
                                                    ? [...ids, category.id]
                                                    : ids.filter((id) => id !== category.id),
                                            )
                                        }
                                    />
                                }
                            />
                        ))}
                    <Button variant="contained" disabled={!canSend} onClick={send}>
                        {t`Send request`}
                    </Button>
                </ListItem>
            </List>

            {history.length > 0 && (
                <List subheader={<ListSubheader component="div">{t`History`}</ListSubheader>}>
                    {history.map((share) => (
                        <ListItem key={share.id} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            <ListItemText
                                primary={
                                    share.incoming
                                        ? t`From ${share.senderUsername}: ${describe(share)}`
                                        : t`To ${share.recipientUsername}: ${describe(share)}`
                                }
                                secondary={[statusText(share), twoWayText(share)].filter(Boolean).join(' · ')}
                            />
                            {!share.incoming && share.status === LibraryShareStatus.Pending && (
                                <Button onClick={() => cancel(share)}>{t`Cancel`}</Button>
                            )}
                            {!share.incoming && share.status === LibraryShareStatus.Accepted && share.synced && (
                                <Button onClick={() => cancel(share)}>{t`Stop syncing`}</Button>
                            )}
                            {share.incoming && share.status === LibraryShareStatus.Accepted && share.synced && (
                                <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                                    <FormControlLabel
                                        label={t`Sync automatically`}
                                        control={
                                            <Switch
                                                checked={share.autoSync}
                                                onChange={(e) => setAutoSync(share, e.target.checked)}
                                            />
                                        }
                                    />
                                    <Button onClick={() => syncNow(share)}>{t`Sync now`}</Button>
                                    {share.pairedWith == null &&
                                        (share.twoWayStatus == null ||
                                            share.twoWayStatus === LibraryShareStatus.Declined ||
                                            share.twoWayStatus === LibraryShareStatus.Cancelled) && (
                                            <Button onClick={() => askTwoWay(share)}>{t`Ask for two-way sync`}</Button>
                                        )}
                                </Stack>
                            )}
                        </ListItem>
                    ))}
                </List>
            )}
        </List>
    );
}
