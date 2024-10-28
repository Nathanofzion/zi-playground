import { Box, styled } from '@mui/material';

const Row = styled(Box)`
  width: ${({ width }) => width ?? '100%'};
  display: flex;
  padding: 0;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'flex-start'};
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`;

const RowBetween = styled(Row)`
  justify-content: space-between;
`;

const RowFlat = styled('div')`
  display: flex;
  align-items: flex-end;
`;

const AutoRow = styled(Row, {
    shouldForwardProp: (prop) => prop !== 'gap' && prop !== 'nowrap' && prop !== 'justify',
})`
  flex-wrap: ${({ nowrap }) => (nowrap ? `nowrap` : `wrap`)};
  justify-content: ${({ justify }) => justify && justify};

  & > * {
    margin: ${({ gap }) => gap};
  }
`;

const RowFixed = styled(Row)`
  width: fit-content;
  margin: ${({ gap }) => gap && `-${gap}`};
`;

export { RowBetween, RowFixed, RowFlat, AutoRow }
export default Row;
