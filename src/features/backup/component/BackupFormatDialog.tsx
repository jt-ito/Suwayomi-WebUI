/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import type { AwaitableComponentProps } from 'awaitable-component';
import { useLingui } from '@lingui/react/macro';
import type { BackupFormat } from '@/features/backup/Backup.types.ts';

/**
 * Asks which kind of backup to create. Both kinds are equal choices, which the confirm dialog (a "main" button and an
 * "extra" one on the other side) cannot show.
 */
export const BackupFormatDialog = ({
    onDismiss,
    onSubmit,
    isVisible,
    onExitComplete,
}: AwaitableComponentProps<BackupFormat>) => {
    const { t } = useLingui();

    const options: { format: BackupFormat; title: string; description: string }[] = [
        {
            format: 'tsundoku',
            title: t`Tsundoku`,
            description: t`Everything in this app, including the extensions and repositories`,
        },
        {
            format: 'suwayomi',
            title: t`Suwayomi`,
            description: t`Without the extensions, repositories and server settings, so the official Suwayomi server can restore it`,
        },
    ];

    return (
        <Dialog open={isVisible} onTransitionExited={onExitComplete} maxWidth="xs" fullWidth onClose={onDismiss}>
            <DialogTitle>{t`Create backup`}</DialogTitle>
            <DialogContent>
                <Stack sx={{ gap: 1.5, pt: 0.5 }}>
                    {options.map(({ format, title, description }) => (
                        <ListItemButton
                            key={format}
                            onClick={() => onSubmit(format)}
                            sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}
                        >
                            <ListItemText
                                primary={title}
                                secondary={description}
                                slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                            />
                        </ListItemButton>
                    ))}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onDismiss} color="primary">
                    {t`Cancel`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
