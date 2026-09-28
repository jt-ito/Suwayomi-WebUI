/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import React from 'react';

interface IProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    minHeight?: number;
}

export const OptionsPanel: React.FC<IProps> = ({ open, onClose, children, minHeight }) => (
    <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        slotProps={{
            backdrop: { sx: { backdropFilter: 'blur(2px)', backgroundColor: 'rgba(0, 0, 0, 0.45)' } },
            paper: {
                sx: (theme) => ({
                    maxWidth: 600,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    minHeight,
                    backgroundImage: 'none',
                    borderRadius: '22px 22px 0 0',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    borderTop: `1.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderBottom: 'none',
                    boxShadow: `0 -10px 40px rgba(0, 0, 0, 0.45), 0 -2px 10px ${alpha(theme.palette.primary.main, 0.15)}`,
                    '& .MuiTabs-root': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        borderRadius: '22px 22px 0 0',
                    },
                    '& .MuiTab-root:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.06) },
                    '& .MuiFormControlLabel-root': {
                        borderRadius: '8px',
                        userSelect: 'none',
                        transition: 'background-color 130ms ease',
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                    },
                    '& .MuiFormControlLabel-label': { fontWeight: 500, fontSize: '0.9rem' },
                }),
            },
        }}
    >
        <Box>{children}</Box>
    </Drawer>
);
