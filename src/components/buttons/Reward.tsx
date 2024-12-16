import { darken } from 'polished';
import { styled } from '@mui/material';
import { BaseButton, ButtonLight, ButtonPrimary } from '@/components/buttons/Button';
import React from 'react';

const ActiveButton = styled(BaseButton)`
  width: auto;
  max-height: 30px;
  height: 30px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
  background-color: ${({ theme }) => theme.palette.customBackground.accentAction};
  color: ${({ theme }) => theme.palette.custom.accentTextLightPrimary};
  &:focus {
    box-shadow: 0 0 0 1pt
      ${({ theme }) => darken(0.05, theme.palette.customBackground.accentAction)};
    background-color: ${({ theme }) => darken(0.05, theme.palette.customBackground.accentAction)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.palette.customBackground.accentAction)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.palette.customBackground.accentAction)};
    background-color: ${({ theme }) => darken(0.1, theme.palette.customBackground.accentAction)};
  }
  &:disabled {
    background-color: ${({ theme, altDisabledStyle, disabled }) =>
    altDisabledStyle
      ? disabled
        ? theme.palette.customBackground.accentAction
        : theme.palette.customBackground.interactive
      : theme.palette.customBackground.interactive};
    color: ${({ altDisabledStyle, disabled, theme }) =>
    altDisabledStyle
      ? disabled
        ? '#FFFFFF'
        : theme.palette.secondary.main
      : theme.palette.secondary.main};
    cursor: auto;
    box-shadow: none;
    border: 1px solid transparent;
    outline: none;
  }
`

export function AirdropButton({ style, light }: { style?: React.CSSProperties; light?: boolean }) {

  const handleClick = () => {

  };

  const ButtonComponent = light ? ButtonLight : ButtonPrimary;

  return (
    <>
      <ButtonComponent style={style} onClick={handleClick}>
        Airdrop
      </ButtonComponent>
    </>
  );
}


export function ActiveAirdropButton({ style, light }: { style?: React.CSSProperties; light?: boolean }) {
  return (
    <ActiveButton>
      <span>Airdrop</span>
    </ActiveButton>
  )
}