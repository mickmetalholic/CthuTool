import { Box, render, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';

const Loading = (): React.JSX.Element => (
  <Box>
    <Text color="cyan">
      <Spinner type="dots" /> Loading...
    </Text>
  </Box>
);

export const runLoadingScreen = async (durationMs = 2000): Promise<void> => {
  const app = render(<Loading />);
  await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
  app.unmount();
};
