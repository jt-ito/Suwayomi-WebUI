/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { SplashScreen } from '@/features/authentication/components/SplashScreen.tsx';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { AuthManager } from '@/features/authentication/AuthManager.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';

const REFRESH_BEFORE_EXPIRY_MS = 30_000;
const MIN_REFRESH_DELAY_MS = 5_000;

const getTokenExpiry = (token: string): number | null => {
    try {
        const payload = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
        return (JSON.parse(atob(payload)) as { exp?: number }).exp ?? null;
    } catch {
        return null;
    }
};

const refreshPersonalAccountToken = async (refreshToken: string): Promise<void> => {
    try {
        const { data } = await requestManager.refreshUser(refreshToken).response;
        AuthManager.setAccessToken(data!.refreshToken.accessToken);
    } catch (e) {
        // the account is not valid anymore (e.g. deleted), the server falls back to its default account
        AuthManager.removeTokens();
        defaultPromiseErrorHandler('AuthGuard::refreshPersonalAccountToken')(e);
    }
};

/**
 * If the server does not require a login, requests are handled as the default (admin) account.
 * After switching to a personal account (see "UserAccountsDialog"), its tokens are used instead. Since the server does not
 * reject expired tokens in that case, but silently falls back to the default account, the access token has to be
 * refreshed before it expires.
 */
const usePersonalAccountTokenRefresh = () => {
    const { isAuthRequired, accessToken, refreshToken } = AuthManager.useSession();

    useEffect(() => {
        if (isAuthRequired !== false || !accessToken || !refreshToken) {
            return undefined;
        }

        const expiry = getTokenExpiry(accessToken);
        const delay = expiry
            ? Math.max(expiry * 1000 - Date.now() - REFRESH_BEFORE_EXPIRY_MS, MIN_REFRESH_DELAY_MS)
            : MIN_REFRESH_DELAY_MS * 12;

        const timeout = setTimeout(() => refreshPersonalAccountToken(refreshToken), delay);
        return () => clearTimeout(timeout);
    }, [isAuthRequired, accessToken, refreshToken]);
};

export const AuthGuard = ({ children }: { children: ReactNode }) => {
    const { isAuthRequired } = AuthManager.useSession();
    usePersonalAccountTokenRefresh();

    const { data } = requestManager.useGetAbout({
        skip: isAuthRequired !== null,
    });

    const isInitializingRef = useRef(false);
    useEffect(() => {
        if (!data || AuthManager.isAuthInitialized() || isInitializingRef.current) {
            return;
        }
        isInitializingRef.current = true;

        const initialize = async () => {
            AuthManager.setAuthRequired(false);

            // the server does not require a login, so a stored refresh token belongs to a personal account
            const refreshToken = AuthManager.getRefreshToken();
            if (refreshToken) {
                await refreshPersonalAccountToken(refreshToken);
            }

            AuthManager.setAuthInitialized(true);
            requestManager.processQueues();
            isInitializingRef.current = false;
        };

        initialize().catch(defaultPromiseErrorHandler('AuthGuard::initialize'));
    }, [data]);

    if (isAuthRequired === null) {
        return <SplashScreen />;
    }

    return children;
};
