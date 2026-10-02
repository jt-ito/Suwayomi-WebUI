/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import { useLingui } from '@lingui/react/macro';
import { PasswordTextField } from '@/base/components/inputs/PasswordTextField.tsx';
import { Confirmation } from '@/base/AppAwaitableComponent.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { AuthManager } from '@/features/authentication/AuthManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import type { GetMeQuery } from '@/lib/graphql/generated/graphql.ts';

const ROLES = ['MEMBER', 'ADMIN'] as const;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,32}$/;

const isValidCredentials = (username: string, password: string) =>
    USERNAME_REGEX.test(username.trim()) && password.length >= 4 && password.length <= 128;

const UserAvatar = ({ username, size = 40 }: { username: string; size?: number }) => (
    <Avatar sx={{ width: size, height: size, bgcolor: 'primary.main', fontWeight: 700 }}>
        {username.charAt(0).toUpperCase()}
    </Avatar>
);

const SwitchAccount = ({ onDone }: { onDone: () => void }) => {
    const { t } = useLingui();
    const [loginUser, { loading }] = requestManager.useLoginUser();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const switchAccount = async () => {
        try {
            const { data } = await loginUser({ variables: { username: username.trim(), password } });
            if (!data) {
                return;
            }

            AuthManager.setTokens(data.login.accessToken, data.login.refreshToken);
            onDone();
            // drop everything that was loaded for the previous account
            window.location.reload();
        } catch (e) {
            makeToast(t`Could not log in to tsundoku`, 'error', getErrorMessage(e));
        }
    };

    return (
        <Stack
            component="form"
            sx={{ gap: 2, pt: 2 }}
            onSubmit={(e) => {
                e.preventDefault();
                switchAccount();
            }}
        >
            <TextField
                label={t`Username`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                fullWidth
            />
            <PasswordTextField value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
            <Button type="submit" variant="contained" disabled={loading || !isValidCredentials(username, password)}>
                {t`Switch account`}
            </Button>
        </Stack>
    );
};

const ManageAccounts = ({ currentUserId }: { currentUserId: number }) => {
    const { t } = useLingui();
    const { data, refetch } = requestManager.useGetUsers();
    const [createUser, { loading: isCreating }] = requestManager.useCreateUser();
    const [deleteUser] = requestManager.useDeleteUser();

    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<(typeof ROLES)[number]>('MEMBER');

    const users = data?.users ?? [];

    const create = async () => {
        try {
            await createUser({ variables: { username: username.trim(), password, role } });
            setUsername('');
            setPassword('');
            setIsCreateFormOpen(false);
            await refetch();
        } catch (e) {
            makeToast(t`Could not create the account`, 'error', getErrorMessage(e));
        }
    };

    const remove = async (user: (typeof users)[number]) => {
        await Confirmation.show({
            title: t`Are you sure?`,
            message: t`You are about to delete the account "${user.username}". Its personal library and reading progress will be removed permanently.`,
        });

        try {
            await deleteUser({ variables: { id: user.id } });
            await refetch();
        } catch (e) {
            makeToast(t`Could not delete the account`, 'error', getErrorMessage(e));
        }
    };

    return (
        <Stack sx={{ gap: 1, pt: 2 }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">{t`Accounts (${users.length})`}</Typography>
                <Button size="small" variant="outlined" onClick={() => setIsCreateFormOpen((open) => !open)}>
                    {t`New account`}
                </Button>
            </Stack>
            {isCreateFormOpen && (
                <Stack
                    component="form"
                    sx={{ gap: 2 }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        create();
                    }}
                >
                    <TextField
                        label={t`Username`}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="off"
                        size="small"
                        fullWidth
                    />
                    <PasswordTextField
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        select
                        label={t`Role`}
                        value={role}
                        onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
                        size="small"
                        fullWidth
                    >
                        {ROLES.map((roleOption) => (
                            <MenuItem key={roleOption} value={roleOption}>
                                {roleOption}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isCreating || !isValidCredentials(username, password)}
                    >
                        {t`Create account`}
                    </Button>
                </Stack>
            )}
            <List disablePadding>
                {users.map((user) => (
                    <ListItem
                        key={user.id}
                        disableGutters
                        secondaryAction={
                            user.id !== 1 && user.id !== currentUserId ? (
                                <IconButton
                                    edge="end"
                                    aria-label={t`Delete account`}
                                    onClick={() => remove(user).catch(defaultPromiseErrorHandler('remove user'))}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            ) : undefined
                        }
                    >
                        <ListItemAvatar>
                            <UserAvatar username={user.username} size={32} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                                    {user.username}
                                    {user.id === currentUserId && (
                                        <Chip size="small" color="success" label={t`Active`} />
                                    )}
                                </Stack>
                            }
                            secondary={`${user.role} • #${user.id}`}
                        />
                    </ListItem>
                ))}
            </List>
        </Stack>
    );
};

export const UserAccountsDialog = ({
    user,
    open,
    onClose,
}: {
    user: NonNullable<GetMeQuery['me']>;
    open: boolean;
    onClose: () => void;
}) => {
    const { t } = useLingui();
    const { isAuthRequired, refreshToken } = AuthManager.useSession();
    const [tab, setTab] = useState<'switch' | 'manage'>('switch');
    const isAdmin = user.role === 'ADMIN';
    // without a required login, there is nothing to sign out of, unless a personal account is in use
    const canSignOut = !!isAuthRequired || !!refreshToken;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>{t`Accounts`}</DialogTitle>
            <DialogContent>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
                    <UserAvatar username={user.username} />
                    <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 600 }}>
                            {user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user.role} • #{user.id}
                        </Typography>
                    </Stack>
                    {canSignOut && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                onClose();
                                // clears the tokens and all cached data, which brings up the login page (or, if the
                                // server does not require a login, the default account)
                                requestManager.reset();
                            }}
                        >
                            {t`Sign out`}
                        </Button>
                    )}
                </Stack>
                {isAdmin && (
                    <Tabs value={tab} onChange={(_, newTab) => setTab(newTab)} variant="fullWidth" sx={{ mt: 2 }}>
                        <Tab value="switch" label={t`Switch account`} />
                        <Tab value="manage" label={t`Manage accounts`} />
                    </Tabs>
                )}
                {tab === 'manage' && isAdmin ? (
                    <ManageAccounts currentUserId={user.id} />
                ) : (
                    <SwitchAccount onDone={onClose} />
                )}
            </DialogContent>
        </Dialog>
    );
};
