/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { Link } from 'react-router-dom';
import type { AwaitableComponentProps } from 'awaitable-component';
import { useLingui } from '@lingui/react/macro';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import type { ValidateBackupResult } from '@/lib/graphql/generated/graphql-base.types.ts';

export const BackupValidationDialog = ({
    validationResult,
    onDismiss,
    onSubmit,
    isVisible,
    onExitComplete,
}: AwaitableComponentProps & { validationResult: ValidateBackupResult }) => {
    const { t } = useLingui();

    // the backup lists the extensions that were installed; older backups only name the sources of library manga
    const missingExtensions = validationResult?.missingExtensions ?? [];
    const missingSources = missingExtensions.length
        ? missingExtensions.map(({ pkgName, name }) => ({ id: pkgName, name: name.replace(/^Tachiyomi:\s*/, '') }))
        : (validationResult?.missingSources ?? []);
    const missingTrackers = validationResult?.missingTrackers ?? [];

    return (
        <Dialog open={isVisible} onTransitionExited={onExitComplete} onClose={onDismiss} maxWidth="xs" fullWidth>
            <DialogTitle>{t`Before restoring`}</DialogTitle>
            <DialogContent>
                <Stack sx={{ gap: 2 }}>
                    {!!missingSources.length && (
                        <Alert severity="info" variant="outlined" sx={{ alignItems: 'flex-start' }}>
                            <Stack sx={{ gap: 1 }}>
                                <span>
                                    {t`These extensions are not installed. They get installed automatically while restoring, as long as an extension repository from the backup or on this server offers them.`}
                                </span>
                                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                    {missingSources.map(({ id, name }) => (
                                        <Chip key={id} size="small" variant="outlined" label={name} />
                                    ))}
                                </Stack>
                            </Stack>
                        </Alert>
                    )}
                    {!!missingTrackers.length && (
                        <Alert severity="warning" variant="outlined" sx={{ alignItems: 'flex-start' }}>
                            <Stack sx={{ gap: 1 }}>
                                <span>{t`You are not logged in to these trackers. Their data is restored, but syncing needs a login.`}</span>
                                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                    {missingTrackers.map(({ name }) => (
                                        <Chip key={name} size="small" variant="outlined" label={name} />
                                    ))}
                                </Stack>
                            </Stack>
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
                {missingTrackers.length ? (
                    <Button onClick={onDismiss} component={Link} to={AppRoutes.settings.children.tracking.path}>
                        {t`Log in`}
                    </Button>
                ) : (
                    <span />
                )}
                <Stack direction="row" sx={{ gap: 1 }}>
                    <Button onClick={onDismiss}>{t`Cancel`}</Button>
                    <Button onClick={onSubmit} variant="contained" autoFocus>
                        {t`Restore`}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};
