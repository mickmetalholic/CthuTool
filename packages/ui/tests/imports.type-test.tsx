import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  EmptyState,
  IconButton,
  MetadataList,
  MetricTile,
  Notice,
  ScrollArea,
  Separator,
  StatusBadge,
  StatusList,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../src';

const className = cn('base', false && 'hidden');

export const SharedImports = () => (
  <TooltipProvider>
    <Card className={className}>
      <CardContent>
        <Badge>Ready</Badge>
        <StatusBadge status="connected">Connected</StatusBadge>
        <Button type="button">Save</Button>
        <IconButton aria-label="Refresh" type="button">
          <span aria-hidden="true">R</span>
        </IconButton>
        <Notice title="Connection unavailable" variant="warning">
          Check the configured backend URL.
        </Notice>
        <EmptyState title="No tasks">Tasks will appear here.</EmptyState>
        <MetricTile label="Online Agents" value="2" />
        <MetadataList rows={[['Backend URL', 'http://localhost:3000']]} />
        <StatusList rows={[['Runtime', 'ready']]} />
        <Separator />
        <ScrollArea>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Content</TabsContent>
        </Tabs>
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>Tip</TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  </TooltipProvider>
);
