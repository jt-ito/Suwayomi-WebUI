/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { alpha } from '@mui/material/styles';
import { useLingui } from '@lingui/react/macro';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { AuthManager } from '@/features/authentication/AuthManager.ts';
import { UserAccountsDialog } from '@/features/authentication/components/UserAccountsDialog.tsx';

/**
 * Shows the logged-in user at the bottom of the sidebar and opens the account switcher/manager.
 * Only visible when the server requires a login.
 */
export const UserProfileCard = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const { t } = useLingui();
    const { isAuthRequired, accessToken } = AuthManager.useSession();
    const [isOpen, setIsOpen] = useState(false);

    const { data } = requestManager.useGetMe({ skip: !isAuthRequired || !accessToken });
    const user = data?.me;

    if (!user) {
        return null;
    }

    return (
        <>
            <ButtonBase
                aria-label={t`Accounts`}
                title={`${user.username} (${user.role})`}
                onClick={() => setIsOpen(true)}
                sx={(theme) => ({
                    m: 1,
                    mt: 'auto',
                    p: isCollapsed ? 1 : '8px 10px',
                    gap: 1.25,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    textAlign: 'start',
                    borderRadius: '10px',
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                    transition: 'background-color 150ms ease, transform 100ms cubic-bezier(0.2, 0, 0, 1)',
                    '&:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.06) },
                    '&:active': { transform: 'scale(0.98)' },
                })}
            >
                <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                    {user.username.charAt(0).toUpperCase()}
                </Avatar>
                {!isCollapsed && (
                    <>
                        <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography noWrap sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                {user.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                {user.role}
                            </Typography>
                        </Stack>
                        <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.6 }} />
                    </>
                )}
            </ButtonBase>
            <UserAccountsDialog user={user} open={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};
