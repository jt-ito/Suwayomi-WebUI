/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { Navigate, useNavigate } from 'react-router-dom';
import { alpha, keyframes, useTheme } from '@mui/material/styles';
import { StringParam, useQueryParam } from 'use-query-params';
import { useLingui } from '@lingui/react/macro';
import { PasswordTextField } from '@/base/components/inputs/PasswordTextField.tsx';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { AuthManager } from '@/features/authentication/AuthManager.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { useNavBarContext } from '@/features/navigation-bar/NavbarContext.tsx';
import { SearchParam } from '@/base/Base.types.ts';
import { SplashScreen } from '@/features/authentication/components/SplashScreen.tsx';
import { ServerAddressSetting } from '@/features/settings/components/ServerAddressSetting.tsx';
import { darkPanelColor } from '@/features/theme/services/ForkComponentOverrides.ts';

const EASING = 'cubic-bezier(0.2, 0, 0, 1)';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const rise = keyframes`
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: none; }
`;

export const LoginPage = () => {
    const theme = useTheme();
    const { t } = useLingui();
    const { setOverride } = useNavBarContext();
    const navigate = useNavigate();
    const isAuthenticated = AuthManager.useIsAuthenticated();

    const [redirect] = useQueryParam(SearchParam.REDIRECT, StringParam);
    const [loginUser, { loading: isLoading }] = requestManager.useLoginUser();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [stayLoggedIn, setStayLoggedIn] = useState(true);
    AuthManager.useSession();
    const savedAccounts = AuthManager.getSavedAccounts();

    const doLogin = async () => {
        try {
            const { data } = await loginUser({ variables: { username, password } });

            if (data) {
                AuthManager.setTokens(data.login.accessToken, data.login.refreshToken, stayLoggedIn);
                requestManager.processQueues();
                navigate(redirect ?? AppRoutes.root.path);
            }
        } catch (e) {
            makeToast(t`Could not log in to tsundoku`, 'error', getErrorMessage(e));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!isLoading && username && password) {
            doLogin();
        }
    };

    useEffect(() => {
        setOverride({ status: true, value: null });

        return () => setOverride({ status: false, value: null });
    }, []);

    if (isAuthenticated) {
        return <Navigate to={AppRoutes.root.path} replace />;
    }

    return (
        <Stack
            sx={{
                [theme.breakpoints.up('lg')]: {
                    flexDirection: 'row',
                },
            }}
        >
            <SplashScreen
                slots={{
                    stackProps: {
                        sx: {
                            position: 'unset',
                            minWidth: 'auto',
                            minHeight: '32vh',
                            flexBasis: '60%',
                            p: 4,
                            // soft accent glow behind the logo
                            backgroundImage: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.main, 0.16)} 0%, transparent 58%)`,
                            [theme.breakpoints.up('lg')]: {
                                minHeight: '0vh',
                                height: '100vh',
                            },
                        },
                    },
                    logoProps: {
                        sx: {
                            fontSize: 140,
                            filter: `drop-shadow(0 0 36px ${alpha(theme.palette.primary.main, 0.35)})`,
                            [theme.breakpoints.up('lg')]: {
                                fontSize: 320,
                            },
                        },
                    },
                    serverAddressProps: {
                        sx: {
                            display: 'none',
                        },
                    },
                }}
            />
            <Stack
                sx={{
                    position: 'relative',
                    minHeight: '68vh',
                    flexBasis: '40%',
                    p: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: darkPanelColor(theme),
                    borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                    [theme.breakpoints.up('lg')]: {
                        minHeight: '0vh',
                        height: '100vh',
                        borderTop: 'none',
                        borderLeft: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                    },
                }}
            >
                <Stack
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        width: '100%',
                        maxWidth: 360,
                        gap: 3,
                        animation: `${rise} 320ms ${EASING} both`,
                    }}
                >
                    <Stack sx={{ gap: 0.5 }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                            {t`Welcome back`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t`Log in to your tsundoku server.`}
                        </Typography>
                    </Stack>
                    {savedAccounts.length > 0 && (
                        <List dense disablePadding>
                            {savedAccounts.map((account) => (
                                <ListItemButton
                                    key={account.userId}
                                    onClick={() => {
                                        AuthManager.activateSavedAccount(account);
                                        window.location.assign(redirect ?? AppRoutes.root.path);
                                    }}
                                >
                                    <ListItemText primary={t`Continue as ${account.username}`} />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                    <Stack sx={{ gap: 2 }}>
                        <TextField
                            autoFocus
                            id="username"
                            name="username"
                            label={t`Username`}
                            type="text"
                            fullWidth
                            autoComplete="username"
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <PasswordTextField
                            fullWidth
                            autoComplete="current-password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Stack>
                    <FormControlLabel
                        label={t`Stay signed in`}
                        control={
                            <Checkbox checked={stayLoggedIn} onChange={(e) => setStayLoggedIn(e.target.checked)} />
                        }
                    />
                    <Button
                        type="submit"
                        size="large"
                        fullWidth
                        variant="contained"
                        disabled={isLoading || !username || !password}
                        startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                        {isLoading ? t`Logging in…` : t`Log in`}
                    </Button>
                </Stack>
                <Stack
                    sx={{
                        mt: 5,
                        [theme.breakpoints.up('lg')]: {
                            mt: 0,
                            position: 'absolute',
                            left: 16,
                            bottom: 16,
                        },
                        '& .MuiListItemButton-root': {
                            borderRadius: '10px',
                            border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                            py: 0.75,
                            px: 1.5,
                            transition: `border-color 150ms ease, background-color 150ms ease, transform 100ms ${EASING}`,
                            '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.45) },
                            '&:active': { transform: 'scale(0.98)' },
                        },
                        '& .MuiListItemText-root': { my: 0 },
                        '& .MuiListItemText-primary': {
                            fontSize: '0.6875rem',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'text.secondary',
                        },
                        '& .MuiListItemText-secondary': {
                            fontFamily: MONO,
                            fontSize: '0.8125rem',
                            color: 'text.primary',
                        },
                    }}
                >
                    <ServerAddressSetting />
                </Stack>
            </Stack>
        </Stack>
    );
};
