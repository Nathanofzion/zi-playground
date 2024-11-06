// eslint-disable-next-line no-unused-vars
import React from 'react';

import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

const Grid2 = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
`

const ContentWrapper = styled(Box)`
  position: absolute;
  top: 50%;
  left: 75%;
  transform: translate(-50%, -50%);

  min-height: 100px;
  min-width: 200px;

  background: ${({ theme }) => `linear-gradient(${theme.palette.customBackground.module}, ${theme.palette.customBackground.module
    }) padding-box,
              linear-gradient(150deg, rgba(136,102,221,1) 0%, rgba(${theme.palette.mode == 'dark' ? '33,29,50,1' : '255,255,255,1'
    }) 35%, rgba(${theme.palette.mode == 'dark' ? '33,29,50,1' : '255,255,255,1'
    }) 65%, rgba(136,102,221,1) 100%) border-box`};
  border: 1px solid transparent;

  display: flex;
  padding: 32px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;

  border-radius: 16px;
  box-shadow: 0px 4px 10px 0px rgba(136, 102, 221, 0.1);

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    padding: 24px;
    left: unset;
    top: unset;
    transform: unset;
    bottom: 0;
  }
`;

export default function ModalBox({ children }) {
  return (
    <Grid2>
      <Box />
      <ContentWrapper>
        {children}
      </ContentWrapper>
    </Grid2>
  )
}

ModalBox.propTypes = {
  children: PropTypes,
}