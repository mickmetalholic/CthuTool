import { Box, render, Text } from 'ink';
import type React from 'react';
import type { GreetingViewModel } from '../domain/flow-result';

export const ResultApp = ({
  model,
}: {
  model: GreetingViewModel;
}): React.JSX.Element => (
  <Box flexDirection="column">
    <Text>{model.panel.title}</Text>
    <Text>{model.panel.body}</Text>
    <Text color={model.status === 'success' ? 'green' : 'yellow'}>
      {model.message}
    </Text>
  </Box>
);

export const renderResultApp = (model: GreetingViewModel): void => {
  render(<ResultApp model={model} />);
};
