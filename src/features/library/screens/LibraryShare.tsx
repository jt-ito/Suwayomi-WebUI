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
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
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
            .respondToLibraryShare(share.id, accept)
            .response.then((result) => {
                const added = result.data?.respondToLibraryShare.addedMangas ?? 0;
                makeToast(accept ? t`Added ${added} manga to your library` : t`Request declined`, 'success');
            })
            .catch((e) => makeToast(t`Could not answer the request`, 'error', getErrorMessage(e)));

    const cancel = (share: Share) =>
        requestManager
            .cancelLibraryShare(share.id)
            .response.catch((e) => makeToast(t`Could not cancel the request`, 'error', getErrorMessage(e)));

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

    const statusText = (share: Share) => {
        switch (share.status) {
            case LibraryShareStatus.Pending:
                return t`Waiting for approval`;
            case LibraryShareStatus.Accepted:
                return t`Accepted`;
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
                                primary={t`${share.senderUsername} wants to share ${describe(share)} with you`}
                                secondary={t`Nothing is added to your library until you accept`}
                            />
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
                                secondary={statusText(share)}
                            />
                            {!share.incoming && share.status === LibraryShareStatus.Pending && (
                                <Button onClick={() => cancel(share)}>{t`Cancel`}</Button>
                            )}
                        </ListItem>
                    ))}
                </List>
            )}
        </List>
    );
}
